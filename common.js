const Moment = require("moment");
const { extendMoment } = require("moment-range");
const {
  FORMAT_DATE,
  TIME_START_DEFAULT,
  FORMAT_HOURS,
  FORMAT_TIME,
  DATE_DEFAULT,
} = require("./constant");
const moment = extendMoment(Moment);

const getDepartmentNameJP = (departmentName) => {
  let name = "";
  switch (departmentName) {
    case "INTERNAL_MEDICINE":
      name = "内科";
      break;
    case "CHILDREN_MEDICINE":
      name = "小児科";
      break;
    case "CHILDREN_VACCINE_MEDICINE":
      name = "小児科ワクチン専任(対象：小児～成人)";
      break;
    case "INTERNAL_VACCINE_MEDICINE":
      name = "内科ワクチン専任(対象：小児～成人)";
      break;
    default:
      break;
  }
  return name;
};

const getAvailableShiftTypesJP = (avTypes) => {
  let name = "";
  switch (avTypes) {
    case "DEFAULT":
      name = "勤務種別未定";
      break;
    case "FULL_TIME_SHIFT":
      name = "常勤医師のシフト勤務";
      break;
    case "FULL_TIME_SHIFT_CHANGE":
      name = "常勤医師のシフト変更勤務";
      break;
    case "FULL_TIME_SHIFT_EXTRA":
      name = "常勤医師の追加勤務";
      break;
    case "PART_TIME_SHIFT_REGULAR":
      name = "定期非常勤医師の定期シフト勤務";
      break;
    case "PART_TIME_SHIFT_CHANGE":
      name = "定期非常勤医師の定期シフト変更勤務";
      break;
    case "PART_TIME_SHIFT_SPOT_WORK":
      name = "定期非常勤医師のスポット勤務";
      break;
    case "NON_REGULAR_PART_TIME_SHIFT_SPOT_WORK":
      name = "非定期非常勤医師のスポット勤務";
      break;
    default:
      break;
  }
  return name;
};

const getIntroductionHistoryTypeJP = (intType) => {
  let name = "";
  switch (intType) {
    case "DIRECT":
      name = "直接";
      break;
    case "REFERENCE_COMPANY":
      name = "参照会社";
      break;
    case "OTHER":
      name = "その他";
      break;
    default:
      break;
  }
  return name;
};

const getCommentTypesJP = (commentTypes) => {
  let name = "";
  switch (commentTypes) {
    case "WORKING_HOUR":
      name = "勤務時間";
      break;
    case "RELATED_SALARY":
      name = "給与関連";
      break;
    case "PAID_HOLIDAY":
      name = "有給休暇";
      break;
    case "SPECIAL_HOLIDAY":
      name = "特別休暇";
      break;
    case "BEING_LATE":
      name = "遅刻";
      break;
    case "CHECK_OUT_EARLY":
      name = "早退";
      break;
    case "CHECK_IN_EARLY":
      name = "早出";
      break;
    case "OVERTIME":
      name = "残業";
      break;
    case "OTHER":
      name = "その他";
      break;
    default:
      break;
  }
  return name;
};

const caculatorSalary = (
  {
    adjustHourlyWageRange,
    startTime,
    endTime,
    hourlyWage,
    splitDateTime1,
    splitDateTime2,
    splitDateTime3,
    splitHourlyWage1,
    splitHourlyWage2,
    splitHourlyWage3,
    isStartTimeBreakTime,
    isSplitDateTime1BreakTime,
    isSplitDateTime2BreakTime,
    isSplitDateTime3BreakTime,
    ...data
  },
  maxDoctorSubsidy
) => {
  let totalDoctorSubsidy = 0;
  for (let i = 0; i < maxDoctorSubsidy; i += 1) {
    if (data[`dsMoney${i}`] != null) {
      totalDoctorSubsidy += parseInt(data[`dsMoney${i}`]);
    }
  }
  const splits = [];
  const interval = moment.range(moment(startTime), moment(endTime));

  let rangeStartTime = startTime;
  const rangeEndTime = endTime;
  if (splitDateTime1 && moment(splitDateTime1).within(interval)) {
    splits.push({
      range: moment.range(moment(rangeStartTime), moment(splitDateTime1)),
      hourlyWage:
        splitHourlyWage1 +
          (!isSplitDateTime1BreakTime ? adjustHourlyWageRange : 0) || 0,
    });
    rangeStartTime = splitDateTime1;
  }
  if (splitDateTime2 && moment(splitDateTime2).within(interval)) {
    splits.push({
      range: moment.range(moment(rangeStartTime), moment(splitDateTime2)),
      hourlyWage:
        splitHourlyWage2 +
          (!isSplitDateTime2BreakTime ? adjustHourlyWageRange : 0) || 0,
    });
    rangeStartTime = splitDateTime2;
  }
  if (splitDateTime3 && moment(splitDateTime3).within(interval)) {
    splits.push({
      range: moment.range(moment(rangeStartTime), moment(splitDateTime3)),
      hourlyWage:
        splitHourlyWage3 +
          (!isSplitDateTime3BreakTime ? adjustHourlyWageRange : 0) || 0,
    });
    rangeStartTime = splitDateTime3;
  }

  splits.push({
    range: moment.range(moment(rangeStartTime), moment(rangeEndTime)),
    hourlyWage:
      hourlyWage + (!isStartTimeBreakTime ? adjustHourlyWageRange : 0) || 0,
  });

  const dailySalary =
    splits.reduce(
      (acc, curr) => acc + (curr.range.diff("minutes") / 60) * curr.hourlyWage,
      0
    ) + totalDoctorSubsidy;

  return Math.round(dailySalary);
};

const checkDateTimeDifference = (endTime, startTime) => {
  const ms = Moment(endTime, "YYYY-MM-DD HH:ss").diff(
    Moment(startTime, "YYYY-MM-DD HH:ss")
  );
  const d = Moment.duration(ms);
  return Math.floor(d.asSeconds());
};

const checkOverlapTimeNoFormat = (
  startTime1,
  endTime1,
  startTime2,
  endTime2
) => {
  const rangeTime1 = moment.range(startTime2, endTime2);
  const rangeTime2 = moment.range(startTime1, endTime1);

  return rangeTime1.overlaps(rangeTime2);
};

const getDate = (date) =>
  `${moment(date).format(FORMAT_DATE)}T${TIME_START_DEFAULT}`;

const getTime = (time) =>
  `${DATE_DEFAULT}T${moment
    .utc(time)
    .add(9, FORMAT_HOURS)
    .format(FORMAT_TIME)}.000`;

const calculateSalary = ({
  startTime,
  endTime,
  hourlyWage,
  splitDateTime1,
  splitDateTime2,
  splitDateTime3,
  splitHourlyWage1,
  splitHourlyWage2,
  splitHourlyWage3,
  isStartTimeBreakTime,
  isSplitDateTime1BreakTime,
  isSplitDateTime2BreakTime,
  isSplitDateTime3BreakTime,
  adjustHourlyWageRange,
}) => {
  const adjustHourlyWageRangeFinal = adjustHourlyWageRange || 0;
  const splits = [];
  const interval = moment.range(moment(startTime), moment(endTime));
  let rangeStartTime = startTime;
  const rangeEndTime = endTime;
  if (splitDateTime1 && moment(splitDateTime1).within(interval)) {
    splits.push({
      range: moment.range(moment(rangeStartTime), moment(splitDateTime1)),
      hourlyWage:
        splitHourlyWage1 +
          (!isSplitDateTime1BreakTime ? adjustHourlyWageRangeFinal : 0) || 0,
    });
    rangeStartTime = splitDateTime1;
  }
  if (splitDateTime2 && moment(splitDateTime2).within(interval)) {
    splits.push({
      range: moment.range(moment(rangeStartTime), moment(splitDateTime2)),
      hourlyWage:
        splitHourlyWage2 +
          (!isSplitDateTime2BreakTime ? adjustHourlyWageRangeFinal : 0) || 0,
    });
    rangeStartTime = splitDateTime2;
  }

  if (splitDateTime3 && moment(splitDateTime3).within(interval)) {
    splits.push({
      range: moment.range(moment(rangeStartTime), moment(splitDateTime3)),
      hourlyWage:
        splitHourlyWage3 +
          (!isSplitDateTime3BreakTime ? adjustHourlyWageRangeFinal : 0) || 0,
    });
    rangeStartTime = splitDateTime3;
  }

  splits.push({
    range: moment.range(moment(rangeStartTime), moment(rangeEndTime)),
    hourlyWage:
      hourlyWage + (!isStartTimeBreakTime ? adjustHourlyWageRangeFinal : 0) ||
      0,
  });

  const dailySalary = splits.reduce(
    (acc, curr) => acc + (curr.range.diff("minutes") / 60) * curr.hourlyWage,
    0
  );
  if (!Number.isInteger(dailySalary)) {
    return parseFloat(dailySalary.toFixed(0));
  }
  return dailySalary;
};

const getWorkPatternJP = (workPattern) => {
  let name = "";
  switch (workPattern) {
    case "PERMANENT_DOCTOR":
      name = "常勤";
      break;
    case "REGULAR_SHIFT_DOCTOR":
      name = "定期非常勤";
      break;
    case "IRREGULAR_SHIFT_DOCTOR":
      name = "不定期非常勤";
      break;
    case "TEMPORARY_DOCTOR":
      name = "スポット";
      break;
    default:
      break;
  }
  return name;
};

const getGenderJP = (gender) => {
  let name = "";
  switch (gender) {
    case "FEMALE":
      name = "女性";
      break;
    case "MALE":
      name = "男性";
      break;
    default:
      break;
  }
  return name;
};

const getJoinBackgroundJP = (joinBackground) => {
  let name = "";
  switch (joinBackground) {
    case "DIRECT":
      name = "直接";
      break;
    case "REFERRAL_COMPANY":
      name = "紹介会社";
      break;
    case "REFERRAL_STAFF":
      name = "スタッフ紹介";
      break;
    case "OTHER":
      name = "その他";
      break;
    default:
      break;
  }
  return name;
};

const getRegistrationStatusJP = (registrationStatus) => {
  let name = "";
  switch (registrationStatus) {
    case "NEW":
      name = "承認待ち";
      break;
    case "PENDING":
      name = "一時保留";
      break;
    case "REJECTED":
      name = "非承認";
      break;
    case "ACCEPTED":
      name = "承認済み";
      break;
    case "CREATED_BY_STAFF":
      name = "スタッフ作成";
      break;
    default:
      break;
  }
  return name;
};

module.exports = {
  getDepartmentNameJP,
  getAvailableShiftTypesJP,
  getIntroductionHistoryTypeJP,
  getCommentTypesJP,
  caculatorSalary,
  checkDateTimeDifference,
  getDate,
  checkOverlapTimeNoFormat,
  getTime,
  calculateSalary,
  getWorkPatternJP,
  getGenderJP,
  getJoinBackgroundJP,
  getRegistrationStatusJP,
};
