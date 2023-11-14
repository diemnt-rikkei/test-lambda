const sqlAcceptedSelectWorkSchedule = () =>
  `SELECT
  w.id idWorkSchedule,
  d.lastname, d.firstname, d.lastnameKana, d.firstnameKana, d.doctorNo, d.medicalLicenseNumber, d.birthday, d.joinBackground, d.joinBackgroundOther,
  c.name clinicName, c.order,cd.name departments,
  w.startTime,w.endTime,a.splitDateTime1,a.splitDateTime2,
  a.splitDateTime3,a.id avaiableShiftId,a.splitHourlyWage1,a.splitHourlyWage2,
  a.splitHourlyWage3, a.hourlyWage, w.adjustHourlyWageRange,
  a.isStartTimeBreakTime,a.isSplitDateTime1BreakTime,a.isSplitDateTime2BreakTime,a.isSplitDateTime3BreakTime,
  s.lastname staffLastname, s.firstname staffFirstName,
  a.comment, a.type avType, a.introductionHistory intType, a.introductionHistoryOther, a.isPublished , w.acceptedReason, wc.id idWorkScheduleComment, wc.text, wc.type wcType, ds.id idDoctorSubsidy, ds.title dsTitle, ds.money dsMoney,
  wa.startTime wsActualStartTime, wa.endTime wsActualEndTime, wa.splitDateTime1 wsActualSplitDateTime1, wa.splitDateTime2 wsActualSplitDateTime2, wa.splitDateTime3 wsActualSplitDateTime3
  FROM WorkSchedule w
  INNER JOIN AvailableShift a ON w.id = a.workSchedule
  LEFT JOIN DoctorSubsidy ds ON ds.availableShift = a.id
  LEFT JOIN WorkScheduleComment wc ON w.id = wc.workSchedule OR a.scheduledAvailableShiftGroup = wc.scheduledAvailableShiftGroup
  LEFT JOIN WorkScheduleActualTime wa ON w.id = wa.workSchedule
  INNER JOIN ClinicalDepartment cd ON cd.id = w.clinicalDepartment
  INNER JOIN Clinic c ON c.id = cd.clinic
  INNER JOIN Doctor d ON d.id = w.doctor
  LEFT JOIN Staff s ON s.id = wc.staff
  where w.deletedAt is null
  AND a.deletedAt is null
  AND wc.deletedAt is null
  AND d.deletedAt is null
  AND ((w.isCreatedByDoctor=1 AND w.accepted=1) OR(w.isCreatedByDoctor=0))
  AND w.startTime <= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(LAST_DAY(DATE_ADD(NOW(), INTERVAL 1 MONTH)), '%Y-%m-%d'), ' 23:59:59'), DATETIME), 'Asia/Tokyo', 'UTC')
  AND w.startTime >= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(CURDATE(), '%Y-%m-01'), ' 00:00:00'), DATETIME), 'Asia/Tokyo', 'UTC')
  group by w.id,d.lastname, d.firstname, d.lastnameKana, d.firstnameKana,
  c.name,cd.name,
  w.startTime,w.endTime,a.id,a.splitDateTime1,a.splitDateTime2,
  a.splitDateTime3,a.splitHourlyWage1,a.splitHourlyWage2,
  a.splitHourlyWage3, a.hourlyWage,  w.adjustHourlyWageRange,
  a.isStartTimeBreakTime,a.isSplitDateTime1BreakTime,a.isSplitDateTime2BreakTime,a.isSplitDateTime3BreakTime,
  a.comment, a.type ,a.introductionHistory, a.introductionHistoryOther, w.acceptedReason, wc.id ,wc.text, wc.type, s.lastname, s.firstname, wa.startTime, wa.endTime,wa.splitDateTime1,wa.splitDateTime2,wa.splitDateTime3, ds.id, ds.title, ds.money;
  `;

const sqlSatisfieldshifts = () => `
SELECT ws.id idWorkSchedule,
  ws.startTime wsStartTime,
  ws.endTime wsEndTime,
  ws.clinicalDepartment wsClinicalDepartment,
  a.clinicalDepartment aClinicalDepartment,
  cd.name,
  c.name as clinicName,
  c.order as clinicOrder,
  a.isStartTimeBreakTime,
  a.deletedAt,
  a.updatedAt,
  a.introductionHistory,
  a.splitHourlyWage3,
  a.startTime,
  a.workPatternApply,
  a.applyWith,
  a.splitHourlyWage2,
  a.isPublished,
  a.splitDateTime3,
  a.updatedHourlyWageAt,
  a.splitHourlyWage1,
  a.isSplitDateTime2BreakTime,
  a.endTime,
  a.introductionHistoryOther,
  a.splitHourlyWage1,
  a.availableShiftToWorkSchedule,
  a.id,
  a.isEditedIndividually,
  a.comment,
  a.hourlyWage,
  a.createdAt,
  a.isSplitDateTime3BreakTime,
  a.isSetIndividually,
  a.splitDateTime2,
  a.timeSettingHideShift,
  a.splitDateTime1,
  a.isSpecial,
  a.type,
  a.isSplitDateTime1BreakTime,
  a.recruitmentShiftsType
  FROM ClinicalDepartment as cd
LEFT JOIN AvailableShift a on a.clinicalDepartment = cd.id
LEFT JOIN Clinic c on cd.clinic = c.id
LEFT JOIN WorkSchedule ws on a.workSchedule = ws.id
WHERE a.startTime >= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(CURDATE(), '%Y-%m-01'), ' 00:00:00'), DATETIME), 'Asia/Tokyo', 'UTC')
 AND a.startTime <= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(LAST_DAY(DATE_ADD(NOW(), INTERVAL 1 MONTH)), '%Y-%m-%d'), ' 23:59:59'), DATETIME), 'Asia/Tokyo', 'UTC')
 AND a.deletedAt IS NULL
`;

const sqlUnfulfilledshifts = () => `
SELECT ws.id idWorkSchedule,
  ws.startTime wsStartTime,
  ws.endTime wsEndTime,
  ws.clinicalDepartment wsClinicalDepartment,
  a.clinicalDepartment aClinicalDepartment,
  cd.name,
  c.name as clinicName,
  c.order as clinicOrder,
  a.isStartTimeBreakTime,
  a.deletedAt,
  a.updatedAt,
  a.introductionHistory,
  a.splitHourlyWage3,
  a.startTime,
  a.workPatternApply,
  a.applyWith,
  a.splitHourlyWage2,
  a.isPublished,
  a.splitDateTime3,
  a.updatedHourlyWageAt,
  a.splitHourlyWage1,
  a.isSplitDateTime2BreakTime,
  a.endTime,
  a.introductionHistoryOther,
  a.splitHourlyWage1,
  a.availableShiftToWorkSchedule,
  a.id,
  a.isEditedIndividually,
  a.comment,
  a.hourlyWage,
  a.createdAt,
  a.isSplitDateTime3BreakTime,
  a.isSetIndividually,
  a.splitDateTime2,
  a.timeSettingHideShift,
  a.splitDateTime1,
  a.isSpecial,
  a.type,
  a.isSplitDateTime1BreakTime,
  a.recruitmentShiftsType
  FROM ClinicalDepartment as cd
LEFT JOIN AvailableShift a on a.clinicalDepartment = cd.id
LEFT JOIN Clinic c on cd.clinic = c.id
LEFT JOIN WorkSchedule ws on a.workSchedule = ws.id
WHERE a.startTime >= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(CURDATE(), '%Y-%m-01'), ' 00:00:00'), DATETIME), 'Asia/Tokyo', 'UTC')
 AND a.startTime <= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(LAST_DAY(DATE_ADD(NOW(), INTERVAL 1 MONTH)), '%Y-%m-%d'), ' 23:59:59'), DATETIME), 'Asia/Tokyo', 'UTC')
 AND a.deletedAt IS NULL
`;

const sqlAvailableShifts = () => {
  return `
  SELECT
    a.id,
    a.createdAt,
    a.startTime,
    a.endTime,
    a.hourlyWage,
    a.splitHourlyWage1,
    a.splitHourlyWage2,
    a.splitHourlyWage3,
    a.splitDateTime1,
    a.splitDateTime2,
    a.splitDateTime3,
    a.isStartTimeBreakTime,
    a.isSplitDateTime1BreakTime,
    a.isSplitDateTime2BreakTime,
    a.isSplitDateTime3BreakTime,
    a.isPublished,
    a.isSpecial,
    a.comment,
    a.recruitmentShiftsType,
    a.clinicalDepartment AS clinicalDepartmentId,
    a.scheduledAvailableShiftGroup AS scheduledAvailableShiftGroupId,
    cd.id AS clinicalDepartmentId,
    cd.name AS clinicalDepartmentName,
    cd.departmentCode AS clinicalDepartmentCode,
    cd.clinic AS clinicId,
    c.name AS clinicName,
    c.order AS clinicOrder
  FROM AvailableShift AS a
  LEFT JOIN ClinicalDepartment AS cd ON a.clinicalDepartment = cd.id
  LEFT JOIN Clinic AS c ON cd.clinic = c.id
  WHERE
    a.workSchedule IS NULL
    AND a.startTime >= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(CURDATE(), '%Y-%m-01'), ' 00:00:00'), DATETIME), 'Asia/Tokyo', 'UTC')
    AND a.startTime <= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(LAST_DAY(DATE_ADD(NOW(), INTERVAL 1 MONTH)), '%Y-%m-%d'), ' 23:59:59'), DATETIME), 'Asia/Tokyo', 'UTC')
    AND a.deletedAt IS NULL
  ORDER BY a.startTime ASC;
  `;
};

const sqlSelectWorkSchedules = () => `
SELECT
w.id idWorkSchedule, w.createdAt appliedDate, w.accepted,
d.lastname, d.firstname, d.lastnameKana, d.firstnameKana, d.doctorNo, d.medicalLicenseNumber, d.birthday,
c.name clinicName, c.order,cd.name departments,
w.startTime,w.endTime,a.splitDateTime1,a.splitDateTime2,
a.splitDateTime3,a.id avaiableShiftId,a.splitHourlyWage1,a.splitHourlyWage2,
a.splitHourlyWage3, a.hourlyWage, w.adjustHourlyWageRange, a.createdAt, a.updatedAt,
a.isStartTimeBreakTime,a.isSplitDateTime1BreakTime,a.isSplitDateTime2BreakTime,a.isSplitDateTime3BreakTime,
s.lastname staffLastname, s.firstname staffFirstName,
a.comment, a.type avType, a.introductionHistory intType, a.introductionHistoryOther, a.isPublished , w.acceptedReason, wc.id idWorkScheduleComment, wc.text, wc.type wcType, ds.id idDoctorSubsidy, ds.title dsTitle, ds.money dsMoney,
wa.startTime wsActualStartTime,
wa.endTime wsActualEndTime,
wa.splitDateTime1 wsActualSplitDateTime1,
wa.splitDateTime2 wsActualSplitDateTime2,
wa.splitDateTime3 wsActualSplitDateTime3
FROM WorkSchedule w
INNER JOIN AvailableShift a ON w.id = a.workSchedule
LEFT JOIN DoctorSubsidy ds ON ds.availableShift = a.id
LEFT JOIN WorkScheduleComment wc ON w.id = wc.workSchedule
LEFT JOIN WorkScheduleActualTime wa ON w.id = wa.workSchedule
INNER JOIN ClinicalDepartment cd ON cd.id = w.clinicalDepartment
INNER JOIN Clinic c ON c.id = cd.clinic
INNER JOIN Doctor d ON d.id = w.doctor
LEFT JOIN Staff s ON s.id = wc.staff
WHERE w.deletedAt is null
AND a.deletedAt is null
AND wc.deletedAt is null
AND d.deletedAt is null
AND w.isCreatedByDoctor=1
AND w.startTime >= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(CURDATE(), '%Y-%m-01'), ' 00:00:00'), DATETIME), 'Asia/Tokyo', 'UTC')
AND w.startTime <= CONVERT_TZ(CONVERT(CONCAT(DATE_FORMAT(LAST_DAY(DATE_ADD(NOW(), INTERVAL 1 MONTH)), '%Y-%m-%d'), ' 23:59:59'), DATETIME), 'Asia/Tokyo', 'UTC')
group by w.id,d.lastname, d.firstname, d.lastnameKana, d.firstnameKana,
c.name,cd.name,
w.startTime,w.endTime,a.id,a.splitDateTime1,a.splitDateTime2,
a.splitDateTime3,a.splitHourlyWage1,a.splitHourlyWage2,
a.splitHourlyWage3, a.hourlyWage,  w.adjustHourlyWageRange,
a.isStartTimeBreakTime,a.isSplitDateTime1BreakTime,a.isSplitDateTime2BreakTime,a.isSplitDateTime3BreakTime,
a.comment, a.type ,a.introductionHistory, a.introductionHistoryOther, w.acceptedReason, wc.id ,wc.text, wc.type, s.lastname, s.firstname, wa.startTime, wa.endTime,wa.splitDateTime1,wa.splitDateTime2,wa.splitDateTime3, ds.id, ds.title, ds.money
ORDER BY appliedDate DESC
`;

const sqlSelectDoctors = () => `SELECT 
    d.id,
    d.lastname,
    d.firstname,
    d.lastnameKana,
    d.firstnameKana,
    d.email,
    d.gender,
    d.doctorNo,
    d.birthday,
    d.phoneNumber,
    d.medicalLicenseNumber,
    dd.value departments,
    a.zipCode,
    a.stateOrRegion,
    a.address1,
    a.address2,
    d.placeOfWork,
    dn.value nearestStations,
    d.workPattern,
    d.joinBackground,
    d.joinBackgroundOther,
    d.staffMemo,
    b.bankName,
    b.bankCode,
    b.branchName,
    b.branchCode,
    b.accountType,
    b.accountNumber,
    b.accountHolderName,
    d.blocked,
    d.medicalRecord,
    d.orca,
    d.questionnaire,
    d.registrationStatus,
    d.createdAt,
    d.updatedAt,
    d.province as province,
    d.isJoinedOnlineDiagnosticTraining,
    d.isJoinedSublingualImmunotherapyELearning,
    d.lastLoggedIn
    FROM Doctor d
    left join Address a on d.id = a.doctor
    left join BankAccount b on d.id = b.doctor
    left join Doctor_nearestStations dn on d.id = dn.nodeId
    left join Doctor_departments dd on d.id = dd.nodeId
    WHERE d.deletedAt IS NULL AND d.registrationStatus NOT IN ('PENDING', 'REJECTED', 'NEW')
    `;

const sqlSelectConversations = () => `
  SELECT 
  c.id,
  d.lastname,
  d.firstname,
  d.firstnameKana,
  d.lastnameKana,
  d.phoneNumber
  FROM Conversation c
  LEFT JOIN Doctor d on d.id = c.doctor
  WHERE c.status IN ('IN_RESPONSE', 'COMPLETED') AND c.doctor IS NOT NULL AND c.receivedLastMessageAt >= DATE_SUB(curdate(), INTERVAL 5 DAY)
  ORDER BY c.receivedLastMessageAt DESC
`;

const sqlSelectConversationContents = (conversationId) => `
  SELECT * FROM ConversationContent 
  where conversation = '${conversationId}'
  order by createdAt desc
  limit 5;
`;

module.exports = {
  sqlAcceptedSelectWorkSchedule,
  sqlSatisfieldshifts,
  sqlUnfulfilledshifts,
  sqlAvailableShifts,
  sqlSelectWorkSchedules,
  sqlSelectDoctors,
  sqlSelectConversations,
  sqlSelectConversationContents,
};
