// utils/jstDay.js
// Returns JST day info for bucketing: { dateStr: "YYYY-MM-DD", day: Date(UTC instant at JST midnight) }
module.exports = function jstDay(source = new Date()) {
  const d = new Date(source);
  const JST_OFFSET_MIN = 9 * 60;

  // shift to JST
  const jstMs = d.getTime() + (JST_OFFSET_MIN - d.getTimezoneOffset()) * 60 * 1000;
  const jst = new Date(jstMs);

  // truncate to JST midnight (in JST view)
  jst.setUTCHours(0, 0, 0, 0);

  // convert back to UTC instant that represents JST midnight
  const utcMsAtJstMidnight = jst.getTime() - (JST_OFFSET_MIN * 60 * 1000);
  const day = new Date(utcMsAtJstMidnight);

  const dateStr = new Date(utcMsAtJstMidnight + (JST_OFFSET_MIN * 60 * 1000))
    .toISOString()
    .slice(0, 10);

  return { dateStr, day };
};
