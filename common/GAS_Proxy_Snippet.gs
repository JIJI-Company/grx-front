/**
 * GRX Infinity Castle - GAS Bot [V6.2 STABLE]
 * ✅ getSheetByName 에러 수정 (ss를 함수 내부에서 직접 취득)
 * ✅ 게시판 자동 파싱 (chapi + boardNo)
 * ✅ 공식 SOOP OpenAPI 썸네일 병합
 * ✅ 3일치 스케줄 필터링
 */

const SOOP_TOKEN    = "3cd50fb722f291aaa2e196a275829114c0f57401";
const SECRET_TOKEN  = "ggu_castle_secure_99";

// =============================================
// 🌐 보안 JSON API (doGet)
// =============================================
function doGet(e) {
  const params = e.parameter || {};
  if (params.token !== SECRET_TOKEN) return out({ error: "Forbidden" });

  const sheetKey = params.sheet || 'all';
  const result   = {};

  try {
    if (sheetKey === 'Live') {
      result['Live'] = getLiveWithThumbnails();
    } else if (sheetKey === 'Schedule') {
      result['Schedule'] = getThreeDaySchedule();
    } else {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const targets = sheetKey === 'all' ? ss.getSheets() : [ss.getSheetByName(sheetKey)].filter(Boolean);
      targets.forEach(s => result[s.getName()] = sheetToJson(s));
    }
    return out(result);
  } catch (err) {
    return out({ error: err.message });
  }
}

// =============================================
// 📡 updateLiveStatus (10분 트리거용)
// =============================================
function updateLiveStatus() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Live');
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return;

  const h = data[0];
  const idIdx     = h.indexOf('id');
  const statusIdx = h.indexOf('status');
  const titleIdx  = h.indexOf('streamTitle');

  for (let i = 1; i < data.length; i++) {
    const bjId = String(data[i][idIdx] || '').trim();
    if (!bjId || bjId.length < 3) continue;
    try {
      const res  = UrlFetchApp.fetch(`https://chapi.sooplive.com/api/${bjId}/station`, {
        muteHttpExceptions: true,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer":    "https://www.sooplive.com/",
          "Origin":     "https://www.sooplive.com"
        }
      });
      const json     = JSON.parse(res.getContentText());
      const isOnAir  = !!(json && json.broad);
      sheet.getRange(i+1, statusIdx+1).setValue(isOnAir ? 'on-air' : 'offline');
      sheet.getRange(i+1, titleIdx +1).setValue(isOnAir ? (json.broad.broad_title || '') : '');
      Logger.log(`${bjId}: ${isOnAir ? 'on-air' : 'offline'}`);
    } catch(e) { Logger.log(`[에러] ${bjId}: ${e.message}`); }
  }
  Logger.log("✅ updateLiveStatus 완료");
}

// =============================================
// 🎥 실시간 썸네일 병합 (공식 OpenAPI)
// =============================================
function getLiveWithThumbnails() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const raw = sheetToJson(ss.getSheetByName('Live'));

  // chapi 방식으로 각 멤버의 방송 썸네일 개별 추출 (이미 updateLiveStatus에서 검증된 방식)
  return raw.map(row => {
    const bjId = String(row.id || '').trim();
    if (!bjId) return { ...row, thumbnail: '' };

    try {
      const res  = UrlFetchApp.fetch(`https://chapi.sooplive.com/api/${bjId}/station`, {
        muteHttpExceptions: true,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer":    "https://www.sooplive.com/",
          "Origin":     "https://www.sooplive.com"
        }
      });
      const json = JSON.parse(res.getContentText());
      if (json && json.broad) {
        // 방송 중: 실시간 썸네일 (liveimg CDN 활용 + broad_no 사용)
        const broadNo = json.broad.broad_no;
        const thumb = broadNo ? `https://liveimg.sooplive.co.kr/m/${broadNo}` : (json.profile_image || '');
        return { ...row, status: 'on-air', streamTitle: json.broad.broad_title || '', thumbnail: thumb };
      }
      return { ...row, status: 'offline', thumbnail: '' };
    } catch(e) {
      Logger.log(`썸네일 실패 ${bjId}: ${e.message}`);
      return { ...row, thumbnail: '' };
    }
  });
}


// =============================================
// 🤖 게시판 자동 파싱 (1시간 트리거용)
// =============================================
function updateAutomatedSchedules() {
  const ss        = SpreadsheetApp.getActiveSpreadsheet();
  const liveSheet = ss.getSheetByName('Live');
  const schSheet  = ss.getSheetByName('Schedule');
  if (!liveSheet || !schSheet) { Logger.log("시트 없음"); return; }

  const members   = sheetToJson(liveSheet);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const rows = [];

  members.forEach(m => {
    const bjId    = String(m.id      || '').trim();
    const boardNo = String(m.boardNo || '').trim();
    if (!bjId || !boardNo) return;

    try {
      const url = `https://chapi.sooplive.com/api/${bjId}/board/${boardNo}?per_page=5&page=1`;
      const res = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          "Referer":    "https://www.sooplive.com/",
          "Origin":     "https://www.sooplive.com",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      const json = JSON.parse(res.getContentText());
      if (!json || !json.data) return;

      json.data.forEach(post => {
        const postDate = new Date(post.reg_date || post.regDate || '');
        if (postDate >= yesterday) {
          rows.push([
            Utilities.formatDate(postDate, "GMT+9", "yyyy-MM-dd"),
            Utilities.formatDate(postDate, "GMT+9", "HH:mm"),
            m.name || bjId,
            post.title,
            "게시판 자동 수집",
            m.profileImg || "",
            post.image_url || ""
          ]);
        }
      });
    } catch(e) { Logger.log(`${bjId} 실패: ${e.message}`); }
  });

  if (rows.length > 0) {
    if (schSheet.getLastRow() === 0) {
      schSheet.appendRow(["Date","Time","Member","Title","Description","Avatar","Thumbnail"]);
    }
    schSheet.getRange(schSheet.getLastRow()+1, 1, rows.length, 7).setValues(rows);
    Logger.log(`✅ 스케줄 ${rows.length}건 추가`);
  } else {
    Logger.log("오늘/어제 새 게시글 없음");
  }
}

// =============================================
// 📅 3일치 필터링
// =============================================
function getThreeDaySchedule() {  // ← ss 파라미터 제거
  const ss    = SpreadsheetApp.getActiveSpreadsheet(); // 내부에서 직접 취득
  const sheet = ss.getSheetByName('Schedule');
  if (!sheet) return [];

  const now   = new Date();
  const limit = new Date();
  limit.setDate(now.getDate() + 3);

  return sheetToJson(sheet)
    .filter(r => { const d = new Date(r.Date || r.date || ''); return d >= now && d <= limit; })
    .sort((a,b) => new Date(a.Date||a.date) - new Date(b.Date||b.date));
}

// =============================================
// 🔧 공통 헬퍼
// =============================================
function out(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
         .setMimeType(ContentService.MimeType.JSON);
}

function sheetToJson(sheet) {
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const h = rows[0];
  return rows.slice(1).map(r => {
    const o = {};
    h.forEach((k, i) => { if (String(k).trim()) o[String(k).trim()] = r[i]; });
    return o;
  });
}
