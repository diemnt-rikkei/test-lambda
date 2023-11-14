const _ = require("lodash");

const getMaxComment = (results) => {
  let maxComment = 1;
  const lstUniq = _.uniqBy(results, "idWorkSchedule");

  lstUniq.forEach((row) => {
    const workSchedules = _.filter(results, {
      idWorkSchedule: row.idWorkSchedule,
    });
    const lstUniqComment = _.uniqBy(workSchedules, "idWorkScheduleComment");

    if (lstUniqComment.length > maxComment) {
      maxComment = lstUniqComment.length;
    }
  });

  return maxComment;
};

const getMaxDoctorSubsidy = (results) => {
  let maxDoctorSubsidy = 1;
  const lstUniq = _.uniqBy(results, "idWorkSchedule");

  lstUniq.forEach((row) => {
    const workSchedules = _.filter(results, {
      idWorkSchedule: row.idWorkSchedule,
    });

    const lstUniqDS = _.uniqBy(workSchedules, "idDoctorSubsidy");

    if (lstUniqDS.length > maxDoctorSubsidy) {
      maxDoctorSubsidy = lstUniqDS.length;
    }
  });

  return maxDoctorSubsidy;
};

const fieldsAcceptedWorkScheduleCsv = (maxComment, maxDoctorSubsidy) => {
  const fieldObject = [
    { label: "名前", value: "fullName" },
    { label: "名前（カタカナ）", value: "fullnameKana" },
    { label: "姓", value: "lastname" },
    { label: "名", value: "firstname" },
    { label: "セイ", value: "lastnameKana" },
    { label: "メイ", value: "firstnameKana" },
    { label: "医師No", value: "doctorNo" },
    { label: "医師生年月日", value: "birthday" },
    { label: "医籍番号", value: "medicalLicenseNumber" },
    { label: "入職経緯", value: "joinBackground" },
    { label: "入職経緯 (備考)", value: "joinBackgroundOther" },
    { label: "クリニックNo", value: "order" },
    { label: "クリニック名", value: "clinicName" },
    { label: "診療科", value: "departmentName" },
    { label: "勤務日", value: "date" },
    { label: "勤務開始時間", value: "startTime" },
    { label: "終了時間1", value: "splitDateTime1" },
    { label: "終了時間2", value: "splitDateTime2" },
    { label: "終了時間3", value: "splitDateTime3" },
    { label: "勤務終了時間", value: "endTime" },
    {
      label: "(元のシフト）勤務開始時間",
      value: "wsActualStartTime",
    },
    {
      label: "(元のシフト)終了時間1",
      value: "wsActualSplitDateTime1",
    },
    {
      label: "(元のシフト)終了時間2",
      value: "wsActualSplitDateTime2",
    },
    {
      label: "(元のシフト）終了時間3",
      value: "wsActualSplitDateTime3",
    },
    {
      label: "(元のシフト)勤務終了時間",
      value: "wsActualEndTime",
    },
    { label: "時給1", value: "splitHourlyWage1" },
    { label: "時給2", value: "splitHourlyWage2" },
    { label: "時給3", value: "splitHourlyWage3" },
    { label: "時給4", value: "hourlyWage" },
    { label: "時給合計", value: "dailySalary" },
  ];

  for (let i = 0; i < maxDoctorSubsidy; i += 1) {
    fieldObject.push({
      label: `追加支給項目${i + 1}`,
      value: `dsTitle${i}`,
    });
    fieldObject.push({
      label: `追加支給額${i + 1}`,
      value: `dsMoney${i}`,
    });
  }
  fieldObject.push({ label: "勤務種別", value: "avType" });
  fieldObject.push({ label: "送信メッセージ", value: "acceptedReason" });
  fieldObject.push({ label: "シフト紹介経緯", value: "intType" });
  fieldObject.push({
    label: "シフト紹介経緯詳細",
    value: "introductionHistoryOther",
  });

  for (let index = 0; index < maxComment; index += 1) {
    fieldObject.push({
      label: `スタッフコメント${index + 1}`,
      value: `comment${index}`,
    });
  }
  fieldObject.push({
    label: "掲載ステータス",
    value: "isPublished",
  });
  fieldObject.push({
    label: "一診シフト時間",
    value: "isshinTime",
  });

  return fieldObject;
};

const fieldAvailableShiftsUnconfirmed = () => {
  const fieldObject = [
    { label: "作成日", value: "createdAt" },
    { label: "クリニックNo", value: "order" },
    { label: "クリニック名", value: "clinicName" },
    { label: "診療科", value: "clinicalDepartmentName" },
    { label: "勤務日", value: "workDate" },
    {
      label: "勤務開始時間",
      value: "startTime",
    },
    {
      label: "終了時間1",
      value: "splitDateTime1",
    },
    {
      label: "終了時間2",
      value: "splitDateTime2",
    },
    {
      label: "終了時間3",
      value: "splitDateTime3",
    },
    {
      label: "勤務終了時間",
      value: "endTime",
    },
    {
      label: "時給1",
      value: "splitHourlyWage1",
    },
    {
      label: "時給2",
      value: "splitHourlyWage2",
    },
    {
      label: "時給3",
      value: "splitHourlyWage3",
    },
    {
      label: "時給4",
      value: "hourlyWage",
    },
    {
      label: "合計日給",
      value: "dailySalary",
    },
    {
      label: "掲載ステータス",
      value: "isPublished",
    },
    {
      label: "作成区分",
      value: "recruitmentShiftsType",
    },
    {
      label: "特別時給設定",
      value: "isSpecial",
    },
    {
      label: "業務内容（備考）",
      value: "comment",
    },
  ];
  return fieldObject;
};

const fieldAvailableShiftsCsv = () => [
  { label: "作成日", value: "createdAt" },
  { label: "クリニックNo", value: "order" },
  { label: "クリニック名", value: "clinicName" },
  { label: "診療科", value: "clinicalDepartmentName" },
  { label: "勤務日", value: "workDate" },
  { label: "勤務開始時間", value: "startTime" },
  { label: "終了時間1", value: "splitDateTime1" },
  { label: "終了時間2", value: "splitDateTime2" },
  { label: "終了時間3", value: "splitDateTime3" },
  { label: "勤務終了時間", value: "endTime" },
  { label: "時給1", value: "hourlyWage" },
  { label: "時給2", value: "splitHourlyWage1" },
  { label: "時給3", value: "splitHourlyWage2" },
  { label: "時給4", value: "splitHourlyWage3" },
  { label: "合計日給", value: "dailySalary" },
  { label: "掲載ステータス", value: "isPublished" },
  { label: "作成区分", value: "recruitmentShiftsType" },
  { label: "特別時給設定", value: "isSpecial" },
  { label: "募集項目1", value: "募集項目1" },
  { label: "募集ステータス1", value: "募集ステータス1" },
  { label: "募集項目2", value: "募集項目2" },
  { label: "募集ステータス2", value: "募集ステータス2" },
];

const fieldsWorkScheduleCsv = () => [
  { label: "名前", value: "fullName" },
  { label: "名前（カタカナ）", value: "fullNameKana" },
  { label: "姓", value: "lastname" },
  { label: "名", value: "firstname" },
  { label: "セイ", value: "lastnameKana" },
  { label: "メイ", value: "firstnameKana" },
  { label: "医師No", value: "doctorNo" },
  { label: "医師生年月日", value: "birthday" },
  { label: "医籍番号", value: "medicalLicenseNumber" },
  { label: "クリニックNo", value: "order" },
  { label: "クリニック名", value: "clinicName" },
  { label: "診療科", value: "departmentName" },
  { label: "勤務日", value: "date" },
  { label: "勤務開始時間", value: "startTime" },
  { label: "終了時間1", value: "splitDateTime1" },
  { label: "終了時間2", value: "splitDateTime2" },
  { label: "終了時間3", value: "splitDateTime3" },
  { label: "勤務終了時間", value: "endTime" },
  { label: "時給1", value: "splitHourlyWage1" },
  { label: "時給2", value: "splitHourlyWage2" },
  { label: "時給3", value: "splitHourlyWage3" },
  { label: "時給4", value: "hourlyWage" },
  { label: "時給合計", value: "dailySalary" },
  { label: "勤務種別", value: "avType" },
  { label: "送信メッセージ", value: "acceptedReason" },
  { label: "シフト紹介経緯", value: "intType" },
  {
    label: "シフト紹介経緯詳細",
    value: "introductionHistoryOther",
  },
  {
    label: "シフト作成日",
    value: "createdAt",
  },
  {
    label: "シフト最終更新日",
    value: "updatedAt",
  },
  {
    label: "医師シフト応募日時",
    value: "appliedDate",
  },
  {
    label: "対応状況",
    value: "accepted",
  },
];

const fieldsDoctorsCsv = () => [
  { label: "姓名", value: "fullName" },
  { label: "セイメイ", value: "fullNameKana" },
  { label: "姓", value: "lastname" },
  { label: "名", value: "firstname" },
  { label: "セイ", value: "lastnameKana" },
  { label: "メイ", value: "firstnameKana" },
  { label: "メールアドレス", value: "email" },
  { label: "性別", value: "gender" },
  { label: "生年月日", value: "birthday" },
  { label: "電話番号", value: "phoneNumber" },
  { label: "医籍登録番号", value: "medicalLicenseNumber" },
  { label: "診療科目", value: "departments" },
  { label: "郵便番号", value: "zipCode" },
  { label: "都道府県", value: "stateOrRegion" },
  { label: "住所1", value: "address1" },
  { label: "住所2", value: "address2" },
  { label: "現在の主な勤務先(都道府県)", value: "province" },
  { label: "現在の主な勤務先名", value: "placeOfWork" },
  { label: "ご自宅最寄駅", value: "nearestStations" },
  { label: "勤務形態", value: "workPattern" },
  { label: "入職経緯", value: "joinBackground" },
  { label: "入職経緯（備考）", value: "joinBackgroundOther" },
  { label: "スタッフメモ", value: "staffMemo" },
  { label: "銀行名", value: "bankName" },
  { label: "銀行コード", value: "bankCode" },
  { label: "支店名", value: "branchName" },
  { label: "支店コード", value: "branchCode" },
  { label: "口座種別", value: "accountType" },
  { label: "口座番号", value: "accountNumber" },
  { label: "口座名義人", value: "accountHolderName" },
  { label: "応募制限", value: "blocked" },
  { label: "電子カルテID", value: "medicalRecord" },
  { label: "ORCAID", value: "orca" },
  { label: "患者アンケートID", value: "questionnaire" },
  { label: "医師ステータス", value: "registrationStatus" },
  { label: "医師No.", value: "doctorNo" },
  { label: "医師データ作成日", value: "createdAt" },
  { label: "医師データ最終更新日", value: "updatedAt" },
  { label: "医師最終ログイン日時", value: "lastLoggedIn" },
  {
    label: "舌下免疫療法E-ラーニング受講",
    value: "isJoinedSublingualImmunotherapyELearning",
  },
  {
    label: "オンライン診療研修受講",
    value: "isJoinedOnlineDiagnosticTraining",
  },
];

const fieldConversationsCsv = () => [
  { label: "医師名", value: "doctorName" },
  { label: "フリガナ", value: "doctorNameKana" },
  { label: "電話番号", value: "doctorPhone" },
  { label: "送信時間", value: "sendingTime" },
  { label: "送信者", value: "createdBy" },
  { label: "送信内容", value: "content" },
];

module.exports = {
  getMaxComment,
  getMaxDoctorSubsidy,
  fieldsAcceptedWorkScheduleCsv,
  fieldAvailableShiftsUnconfirmed,
  fieldAvailableShiftsCsv,
  fieldsWorkScheduleCsv,
  fieldsDoctorsCsv,
  fieldConversationsCsv,
};
