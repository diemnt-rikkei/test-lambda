const mysql = require("mysql");
const _ = require("lodash");
const moment = require("moment");
const {
  sqlAcceptedSelectWorkSchedule,
  sqlSatisfieldshifts,
  sqlUnfulfilledshifts,
  sqlAvailableShifts,
  sqlSelectWorkSchedules,
  sqlSelectDoctors,
  sqlSelectConversations,
  sqlSelectConversationContents,
} = require("./sql-raw");
const {
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
} = require("./common");
const {
  fieldsAcceptedWorkScheduleCsv,
  getMaxComment,
  getMaxDoctorSubsidy,
  fieldAvailableShiftsUnconfirmed,
  fieldAvailableShiftsCsv,
  fieldsWorkScheduleCsv,
  fieldsDoctorsCsv,
  fieldConversationsCsv,
} = require("./csvService");
const { uploadAWS } = require("./s3");

const joinBackground = {
  DIRECT: "直接",
  REFERRAL_COMPANY: "紹介会社",
  REFERRAL_STAFF: "スタッフ紹介",
  OTHER: "その他",
};

const getWorkScheduleResultExport = async ({ results, connection }) => {
  const lstUniq = _.uniqBy(results, "idWorkSchedule");
  const idAvailableShifts = _.uniq(
    results
      .filter((row) => row.idDoctorSubsidy)
      .map(({ avaiableShiftId }) => avaiableShiftId)
  );

  let dataDoctorSubsidies = [];
  if (idAvailableShifts.length) {
    const rawQuery = `SELECT id, title, money, availableShift
    FROM DoctorSubsidy
    WHERE deletedAt IS NULL
    AND availableShift IN ('${idAvailableShifts.join("', '")}');`;

    dataDoctorSubsidies = await queryDatabase(connection, rawQuery);
  }

  lstUniq.forEach((row) => {
    const workSchedules = _.filter(results, {
      idWorkSchedule: row.idWorkSchedule,
    });
    const lstUniqComment = _.uniqBy(workSchedules, "idWorkScheduleComment");
    lstUniqComment.forEach((e, i) => {
      row[`comment${i}`] = e.text
        ? `${e.text}(${getCommentTypesJP(e.wcType)})(スタッフ名:${
            e.staffLastname
          } ${e.staffFirstName})`
        : "";
    });
    let data = [];
    if (row.idDoctorSubsidy) {
      data = dataDoctorSubsidies.filter(
        ({ availableShift }) => availableShift.id === row.avaiableShiftId
      );
    }
    data.forEach((e, i) => {
      row[`dsTitle${i}`] = e.title ? `${e.title}` : "";
      row[`dsMoney${i}`] = e.money ? `${e.money}` : 0;
    });

    // fullname
    const { startTime } = row;
    const startDay = row.startTime;

    row.dailySalary = caculatorSalary(row);
    row.order = row.order < 10 ? `="0${row.order}"` : `="${row.order}"`;
    row.fullName = `${row.lastname}${row.firstname}`;
    row.fullnameKana = `${row.lastnameKana}${row.firstnameKana}`;
    row.birthday = row.birthday
      ? moment(row.birthday).add(9, "hours").format("YYYY/MM/DD")
      : null;
    row.medicalLicenseNumber = row.medicalLicenseNumber
      ? `="${row.medicalLicenseNumber}"`
      : "";
    row.departmentName = getDepartmentNameJP(row.departments);
    row.avType = getAvailableShiftTypesJP(row.avType);
    row.intType = getIntroductionHistoryTypeJP(row.intType);
    row.date = moment(startDay).format("YYYY/MM/DD");
    row.startTime = moment(startTime).format("HH:mm");
    row.splitDateTime1 = row.splitDateTime1
      ? moment(row.splitDateTime1).format("HH:mm")
      : "";
    row.splitDateTime2 = row.splitDateTime2
      ? moment(row.splitDateTime2).format("HH:mm")
      : "";
    row.splitDateTime3 = row.splitDateTime3
      ? moment(row.splitDateTime3).format("HH:mm")
      : "";
    if (moment().isAfter(moment(row.endTime).add(1, "days").startOf("day"))) {
      row.wsActualStartTime = row.wsActualStartTime
        ? moment(row.wsActualStartTime).format("HH:mm")
        : "";
      row.wsActualEndTime = row.wsActualEndTime
        ? moment(row.wsActualEndTime).format("HH:mm")
        : "";
      row.wsActualSplitDateTime1 = row.wsActualSplitDateTime1
        ? moment(row.wsActualSplitDateTime1).format("HH:mm")
        : "";
      row.wsActualSplitDateTime2 = row.wsActualSplitDateTime2
        ? moment(row.wsActualSplitDateTime2).format("HH:mm")
        : "";
      row.wsActualSplitDateTime3 = row.wsActualSplitDateTime3
        ? moment(row.wsActualSplitDateTime3).format("HH:mm")
        : "";
    } else {
      row.wsActualStartTime = "";
      row.wsActualEndTime = "";
      row.wsActualSplitDateTime1 = "";
      row.wsActualSplitDateTime2 = "";
      row.wsActualSplitDateTime3 = "";
    }
    row.endTime = moment(row.endTime).format("HH:mm");
    row.introductionHistoryOther = row.introductionHistoryOther
      ? row.introductionHistoryOther.replace(/\n/g, " ")
      : "";
    row.comment = row.comment ? row.comment.replace(/\n/g, " ") : "";
    row.acceptedReason = row.acceptedReason
      ? row.acceptedReason.replace(/\n/g, " ")
      : "";
    row.isPublished = row.isPublished ? "掲載" : "未掲載";
    // 入職経緯
    row.joinBackground = joinBackground[`${row.joinBackground}`];
    row.joinBackgroundOther = row.joinBackgroundOther || "";
    row.isshinTime = row.isshinTime || "";
  });

  return lstUniq;
};

// exports.handler = async (event) => {
try {
  const connection = mysql.createConnection({
    host: "127.0.0.1",
    port: 3370,
    user: "root",
    password: "wMT9ABAAmyrju3wF",
    database: "default@prisma4",
    timezone: "UTC",
  });

  function connectToDatabase() {
    return new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) {
          reject(err);
        } else {
          resolve(connection);
        }
      });
    });
  }

  function queryDatabase(connection, query) {
    return new Promise((resolve, reject) => {
      connection.query(query, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  async function main() {
    const connectionInstance = await connectToDatabase();

    // １）確定シフトCSVダウンロード
    async function uploadAcceptedWorkSchedules() {
      try {
        const results = await queryDatabase(
          connectionInstance,
          sqlAcceptedSelectWorkSchedule()
        );

        const listWorkSchedules = await getWorkScheduleResultExport({
          results,
          connection: connectionInstance,
        });

        const filename = [
          "確定シフト_",
          `${moment().format("HH")}時${moment().format("mm")}分.CSV`,
        ].join("");

        const fields = fieldsAcceptedWorkScheduleCsv(
          getMaxComment(listWorkSchedules),
          getMaxDoctorSubsidy(listWorkSchedules)
        );

        await uploadAWS(filename, fields, listWorkSchedules);
      } catch (error) {
        console.error("Error in uploadAcceptedWorkSchedules:", error);
      }
    }

    // ２）未充足シフトCSVダウンロード
    async function uploadSatisfieldshifts() {
      try {
        const allAvailableShifts = await queryDatabase(
          connectionInstance,
          sqlSatisfieldshifts()
        );
        const availableShifts = allAvailableShifts?.filter(
          (item) => !item?.workSchedule
        );

        const results = [];
        for (const available of availableShifts) {
          const timeAvailableShift = checkDateTimeDifference(
            available.endTime,
            available.startTime
          );
          let timeWorkSchedule = 0;

          const doctorWorkSchedules = allAvailableShifts.filter(
            (item) =>
              item.wsClinicalDepartment === available.aClinicalDepartment &&
              item.idWorkSchedule
          );

          for (const workSchedule of doctorWorkSchedules) {
            if (
              getDate(available.startTime) ===
                getDate(workSchedule.wsStartTime) &&
              checkOverlapTimeNoFormat(
                getTime(available.startTime),
                getTime(available.endTime),
                getTime(workSchedule.wsStartTime),
                getTime(workSchedule.wsEndTime)
              )
            ) {
              if (
                getTime(available.startTime) > getTime(workSchedule.wsStartTime)
              ) {
                timeWorkSchedule += checkDateTimeDifference(
                  workSchedule.wsEndTime,
                  available.startTime
                );
              } else if (
                getTime(available.endTime) < getTime(workSchedule.wsEndTime)
              ) {
                timeWorkSchedule += checkDateTimeDifference(
                  available.endTime,
                  workSchedule.wsStartTime
                );
              } else {
                timeWorkSchedule += checkDateTimeDifference(
                  workSchedule.wsEndTime,
                  workSchedule.wsStartTime
                );
              }
            }
          }

          if (timeAvailableShift - timeWorkSchedule === timeAvailableShift) {
            results.push(available);
          }
        }

        const resultUnconfirmedShifts = [];
        results.forEach((value) => {
          const departmentName = getDepartmentNameJP(value.name);

          resultUnconfirmedShifts.push({
            id: value.id,
            sort: moment(value.startTime).toISOString(),
            createdAt: moment(value.createdAt).format("YYYY-MM-DD"),
            startTime: moment(value.startTime).format("HH:mm"),
            endTime: moment(value.endTime).format("HH:mm"),
            workDate: moment(value.startTime).format("YYYY-MM-DD"),
            order:
              value.clinicOrder < 10
                ? `="0${value.clinicOrder}"`
                : `="${value.clinicOrder}"`,
            clinicName: value.clinicName,
            clinicalDepartmentName: departmentName,
            hourlyWage: value.hourlyWage,
            dailySalary: calculateSalary({
              startTime: value.startTime,
              endTime: value.endTime,
              hourlyWage: value.hourlyWage,
              splitDateTime1: value.splitDateTime1,
              splitDateTime2: value.splitDateTime2,
              splitDateTime3: value.splitDateTime3,
              splitHourlyWage1: value.splitHourlyWage1,
              splitHourlyWage2: value.splitHourlyWage2,
              splitHourlyWage3: value.splitHourlyWage3,
              isStartTimeBreakTime: value.isStartTimeBreakTime,
              isSplitDateTime1BreakTime: value.isSplitDateTime1BreakTime,
              isSplitDateTime2BreakTime: value.isSplitDateTime2BreakTime,
              isSplitDateTime3BreakTime: value.isSplitDateTime3BreakTime,
            }),
            splitHourlyWage1: value.splitHourlyWage1,
            splitHourlyWage2: value.splitHourlyWage2,
            splitHourlyWage3: value.splitHourlyWage3,
            splitDateTime1: value.splitDateTime1
              ? moment(value.splitDateTime1).format("HH:mm")
              : undefined,
            splitDateTime2: value.splitDateTime2
              ? moment(value.splitDateTime2).format("HH:mm")
              : undefined,
            splitDateTime3: value.splitDateTime3
              ? moment(value.splitDateTime3).format("HH:mm")
              : undefined,
            isPublished: !value.isPublished ? "未掲載中" : "",
            recruitmentShiftsType:
              value.recruitmentShiftsType == "SINGLE" ? "個別作成" : "定期作成",
            isSpecial: value.isSpecial ? "特別時給設定あり" : "",
            comment: value.comment
              ? value.comment.replace(/\r?\n/g, "").replace(",", "")
              : undefined,
          });
        });

        const fields = fieldAvailableShiftsUnconfirmed();
        const filename = [
          "未充足シフト_",
          `${moment().format("HH")}時${moment().format("mm")}分.CSV`,
        ].join("");
        const sortedResult = resultUnconfirmedShifts.sort(
          (a, b) => moment(a.sort) - moment(b.sort)
        );

        await uploadAWS(
          filename,
          fields,
          sortedResult.map((item) => {
            const {
              clinicName,
              clinicalDepartmentName,
              comment,
              createdAt,
              dailySalary,
              endTime,
              hourlyWage,
              isPublished,
              isSpecial,
              order,
              recruitmentShiftsType,
              splitDateTime1,
              splitDateTime2,
              splitDateTime3,
              splitHourlyWage1,
              splitHourlyWage2,
              splitHourlyWage3,
              startTime,
              workDate,
            } = item;
            return {
              createdAt,
              order,
              clinicName,
              clinicalDepartmentName,
              workDate,
              startTime,
              splitDateTime1,
              splitDateTime2,
              splitDateTime3,
              endTime,
              splitHourlyWage1: hourlyWage,
              splitHourlyWage2: splitHourlyWage1,
              splitHourlyWage3: splitHourlyWage2,
              hourlyWage: splitHourlyWage3,
              dailySalary,
              isPublished,
              recruitmentShiftsType,
              isSpecial,
              comment,
            };
          })
        );
      } catch (error) {
        console.error("Error in uploadAcceptedWorkSchedules:", error);
      }
    }

    // ３）半未充足シフトCSVダウンロード
    async function uploadUnfulfilledshifts() {
      try {
        const allAvailableShifts = await queryDatabase(
          connectionInstance,
          sqlUnfulfilledshifts()
        );
        const availableShifts = allAvailableShifts?.filter(
          (item) => !item.idWorkSchedule
        );

        const results = [];
        for (const available of availableShifts) {
          const timeAvailableShift = checkDateTimeDifference(
            available.endTime,
            available.startTime
          );
          let timeWorkSchedule = 0;

          const doctorWorkSchedules = allAvailableShifts.filter(
            (item) =>
              item.wsClinicalDepartment === available.aClinicalDepartment &&
              item.idWorkSchedule
          );

          for (const workSchedule of doctorWorkSchedules) {
            if (
              getDate(available.startTime) ===
                getDate(workSchedule.wsStartTime) &&
              checkOverlapTimeNoFormat(
                getTime(available.startTime),
                getTime(available.endTime),
                getTime(workSchedule.wsStartTime),
                getTime(workSchedule.wsEndTime)
              )
            ) {
              if (
                getTime(available.startTime) > getTime(workSchedule.wsStartTime)
              ) {
                timeWorkSchedule += checkDateTimeDifference(
                  workSchedule.wsEndTime,
                  available.startTime
                );
              } else if (
                getTime(available.endTime) < getTime(workSchedule.wsEndTime)
              ) {
                timeWorkSchedule += checkDateTimeDifference(
                  available.endTime,
                  workSchedule.wsStartTime
                );
              } else {
                timeWorkSchedule += checkDateTimeDifference(
                  workSchedule.wsEndTime,
                  workSchedule.wsStartTime
                );
              }
            }
          }

          if (
            timeWorkSchedule > 0 &&
            timeAvailableShift - timeWorkSchedule >= 3600
          ) {
            results.push(available);
          }
        }

        const resultUnconfirmedShifts = [];
        results.forEach((value) => {
          const departmentName = getDepartmentNameJP(value.name);

          resultUnconfirmedShifts.push({
            id: value.id,
            sort: moment(value.startTime).toISOString(),
            createdAt: moment(value.createdAt).format("YYYY-MM-DD"),
            startTime: moment(value.startTime).format("HH:mm"),
            endTime: moment(value.endTime).format("HH:mm"),
            workDate: moment(value.startTime).format("YYYY-MM-DD"),
            order:
              value.clinicOrder < 10
                ? `="0${value.clinicOrder}"`
                : `="${value.clinicOrder}"`,
            clinicName: value.clinicName,
            clinicalDepartmentName: departmentName,
            hourlyWage: value.hourlyWage,
            dailySalary: calculateSalary({
              startTime: value.startTime,
              endTime: value.endTime,
              hourlyWage: value.hourlyWage,
              splitDateTime1: value.splitDateTime1,
              splitDateTime2: value.splitDateTime2,
              splitDateTime3: value.splitDateTime3,
              splitHourlyWage1: value.splitHourlyWage1,
              splitHourlyWage2: value.splitHourlyWage2,
              splitHourlyWage3: value.splitHourlyWage3,
              isStartTimeBreakTime: value.isStartTimeBreakTime,
              isSplitDateTime1BreakTime: value.isSplitDateTime1BreakTime,
              isSplitDateTime2BreakTime: value.isSplitDateTime2BreakTime,
              isSplitDateTime3BreakTime: value.isSplitDateTime3BreakTime,
            }),
            splitHourlyWage1: value.splitHourlyWage1,
            splitHourlyWage2: value.splitHourlyWage2,
            splitHourlyWage3: value.splitHourlyWage3,
            splitDateTime1: value.splitDateTime1
              ? moment(value.splitDateTime1).format("HH:mm")
              : undefined,
            splitDateTime2: value.splitDateTime2
              ? moment(value.splitDateTime2).format("HH:mm")
              : undefined,
            splitDateTime3: value.splitDateTime3
              ? moment(value.splitDateTime3).format("HH:mm")
              : undefined,
            isPublished: !value.isPublished ? "未掲載中" : "",
            recruitmentShiftsType:
              value.recruitmentShiftsType == "SINGLE" ? "個別作成" : "定期作成",
            isSpecial: value.isSpecial ? "特別時給設定あり" : "",
            comment: value.comment
              ? value.comment.replace(/\r?\n/g, "").replace(",", "")
              : undefined,
          });
        });

        const fields = fieldAvailableShiftsUnconfirmed();
        const filename = [
          "半未充足シフト_",
          `${moment().format("HH")}時${moment().format("mm")}分.CSV`,
        ].join("");
        const sortedResult = resultUnconfirmedShifts.sort(
          (a, b) => moment(a.sort) - moment(b.sort)
        );

        await uploadAWS(
          filename,
          fields,
          sortedResult.map((item) => {
            const {
              clinicName,
              clinicalDepartmentName,
              comment,
              createdAt,
              dailySalary,
              endTime,
              hourlyWage,
              isPublished,
              isSpecial,
              order,
              recruitmentShiftsType,
              splitDateTime1,
              splitDateTime2,
              splitDateTime3,
              splitHourlyWage1,
              splitHourlyWage2,
              splitHourlyWage3,
              startTime,
              workDate,
            } = item;
            return {
              createdAt,
              order,
              clinicName,
              clinicalDepartmentName,
              workDate,
              startTime,
              splitDateTime1,
              splitDateTime2,
              splitDateTime3,
              endTime,
              splitHourlyWage1: hourlyWage,
              splitHourlyWage2: splitHourlyWage1,
              splitHourlyWage3: splitHourlyWage2,
              hourlyWage: splitHourlyWage3,
              dailySalary,
              isPublished,
              recruitmentShiftsType,
              isSpecial,
              comment,
            };
          })
        );
      } catch (error) {
        console.error("Error in uploadAcceptedWorkSchedules:", error);
      }
    }

    // ４）募集シフトCSVダウンロード
    async function uploadAvailableshifts() {
      try {
        const data = await queryDatabase(
          connectionInstance,
          sqlAvailableShifts()
        );

        const results = [];
        const recruitmentCategories = [
          {
            label: "募集項目なし",
            value: "NO_RECRUITMENT",
          },
          {
            label: "MRT",
            value: "MRT",
          },
          {
            label: "民間医局",
            value: "PRIVATE_CLINIC",
          },
          {
            label: "その他 ",
            value: "OTHER",
          },
        ];

        data.forEach((ws) => {
          const item = {
            createdAt: moment(ws.createdAt).format("YYYY-MM-DD"),
            order:
              ws.clinicOrder < 10
                ? `="0${ws.clinicOrder}"`
                : `="${ws.clinicOrder}"`,
            clinicName: ws.clinicName,
            clinicalDepartmentName: getDepartmentNameJP(
              ws.clinicalDepartmentName
            ),
            workDate: moment(ws.startTime).format("YYYY-MM-DD"),
            startTime: moment(ws.startTime).format("HH:mm"),
            splitDateTime1: ws.splitDateTime1
              ? moment(ws.splitDateTime1).format("HH:mm")
              : undefined,
            splitDateTime2: ws.splitDateTime2
              ? moment(ws.splitDateTime2).format("HH:mm")
              : undefined,
            splitDateTime3: ws.splitDateTime3
              ? moment(ws.splitDateTime3).format("HH:mm")
              : undefined,
            endTime: moment(ws.endTime).format("HH:mm"),
            splitHourlyWage1: ws.splitHourlyWage1,
            splitHourlyWage2: ws.splitHourlyWage2,
            splitHourlyWage3: ws.splitHourlyWage3,
            hourlyWage: ws.hourlyWage,
            dailySalary: calculateSalary(ws),
            isPublished: !ws.isPublished ? "未掲載中" : "",
            recruitmentShiftsType:
              ws.recruitmentShiftsType == "SINGLE" ? "個別作成" : "定期作成",
            isSpecial: ws.isSpecial ? "特別時給設定あり" : "",
            comment: ws.comment
              ? ws.comment.replace(/\r?\n/g, "").replace(",", "")
              : undefined,
          };
          const recruitmentCategory = [];

          recruitmentCategory.forEach((rc, indexes) => {
            if (rc.category === "OTHER") {
              item[`募集項目${indexes + 1}`] = `${
                recruitmentCategories.filter(
                  (rci) => rci.value === rc.category
                )[0].label
              }(${rc.description})`;
            } else {
              item[`募集項目${indexes + 1}`] = recruitmentCategories.filter(
                (rci) => rci.value === rc.category
              )[0].label;
            }
          });

          results.push(item);
        });

        const fields = fieldAvailableShiftsCsv();
        const filename = [
          "募集シフト_",
          `${moment().format("HH")}時${moment().format("mm")}分.CSV`,
        ].join("");

        await uploadAWS(filename, fields, results);
      } catch (error) {
        console.error("Error in uploadAcceptedWorkSchedules:", error);
      }
    }

    //５）応募シフトCSVダウンロード
    async function uploadWorkSchedules() {
      const allAvailableShifts = await queryDatabase(
        connectionInstance,
        sqlSelectWorkSchedules()
      );

      const listUnique = _.uniqBy(allAvailableShifts, "idWorkSchedule");

      listUnique.forEach((row) => {
        row.fullName = `${row.lastname} ${row.firstname}`;
        row.fullNameKana = `${row.lastnameKana} ${row.firstnameKana}`;
        row.birthday = row.birthday
          ? moment(row.birthday).format("YYYY/MM/DD")
          : null;
        row.medicalLicenseNumber = row.medicalLicenseNumber
          ? `="${row.medicalLicenseNumber}"`
          : "";
        row.departmentName = getDepartmentNameJP(row.departments);
        row.date = row.startTime
          ? moment(row.startTime).format("YYYY/MM/DD")
          : null;
        row.dailySalary = caculatorSalary(row);
        row.startTime = row.startTime
          ? moment(row.startTime).format("HH:mm")
          : null;
        row.splitDateTime1 = row.splitDateTime1
          ? moment(row.splitDateTime1).format("HH:mm")
          : null;
        row.splitDateTime2 = row.splitDateTime2
          ? moment(row.splitDateTime2).format("HH:mm")
          : null;
        row.splitDateTime3 = row.splitDateTime3
          ? moment(row.splitDateTime3).format("HH:mm")
          : null;
        row.endTime = row.endTime ? moment(row.endTime).format("HH:mm") : null;
        row.avType = getAvailableShiftTypesJP(row.avType);
        row.acceptedReason = row.acceptedReason
          ? row.acceptedReason.replace(/\n/g, " ")
          : "";
        row.createdAt = row.createdAt
          ? moment(row.createdAt).format("YYYY/MM/DD")
          : null;
        row.updatedAt = row.updatedAt
          ? moment(row.updatedAt).format("YYYY/MM/DD")
          : null;
        row.appliedDate = row.appliedDate
          ? moment(row.appliedDate).format("YYYY/MM/DD")
          : null;
        row.accepted =
          row.accepted || row.deletedStatus ? "対応済み" : "未対応";
        row.intType = getIntroductionHistoryTypeJP(row.intType);
        row.acceptedReason = row.acceptedReason
          ? row.acceptedReason.replace(/\n/g, " ")
          : "";
        row.introductionHistoryOther = row.introductionHistoryOther
          ? row.introductionHistoryOther.replace(/\n/g, " ")
          : "";
      });

      const fields = fieldsWorkScheduleCsv();
      const filename = [
        "応募シフト_",
        `${moment().format("HH")}時${moment().format("mm")}分.CSV`,
      ].join("");

      await uploadAWS(filename, fields, listUnique);
    }

    //６）医師情報CSVダウンロード
    async function uploadDoctors() {
      try {
        const results = await queryDatabase(
          connectionInstance,
          sqlSelectDoctors()
        );

        let lstDepartments = [];
        let lstNearestStations = [];
        const lstUniq = _.uniqBy(results, "id");

        lstUniq.forEach((row) => {
          lstDepartments = [];
          lstNearestStations = [];
          const lstValue = _.filter(results, { id: row.id });
          // get departments name
          const lstDepartmentsUniq = _.uniqBy(lstValue, "departments");
          lstDepartmentsUniq.forEach((element) => {
            const departmentName = getDepartmentNameJP(element.departments);
            lstDepartments.push(departmentName);
          });
          const departmentsName = _.join(lstDepartments, "、");
          row.departments = departmentsName;

          // get NearestStations
          const lstnearestStationsUniq = _.uniqBy(lstValue, "nearestStations");
          lstnearestStationsUniq.forEach((element) => {
            lstNearestStations.push(element.nearestStations);
          });
          const nearestStationsName = _.join(lstNearestStations, "、");
          row.nearestStations = nearestStationsName;
          row.fullName = `${row.lastname}${row.firstname}`;
          row.fullNameKana = `${row.lastnameKana}${row.firstnameKana}`;
          row.workPattern = getWorkPatternJP(row.workPattern);
          row.birthday = row.birthday
            ? moment(row.birthday).format("YYYY/MM/DD")
            : null;
          row.gender = getGenderJP(row.gender);
          row.blocked = row.blocked === 1 ? "応募制限中" : null;
          row.joinBackground = getJoinBackgroundJP(row.joinBackground);
          row.registrationStatus = getRegistrationStatusJP(
            row.registrationStatus
          );
          row.doctorNo = row.doctorNo;
          row.createdAt = row.createdAt
            ? moment(row.createdAt).format("YYYY/MM/DD")
            : null;
          row.updatedAt = row.updatedAt
            ? moment(row.updatedAt).format("YYYY/MM/DD")
            : null;
          row.lastLoggedIn = row.lastLoggedIn
            ? moment(row.lastLoggedIn).format("YYYY/MM/DD")
            : null;
          row.phoneNumber = row.phoneNumber ? `="${row.phoneNumber}"` : "";
          row.isJoinedOnlineDiagnosticTraining =
            row.isJoinedOnlineDiagnosticTraining === 1 ? "済" : "未";
          row.isJoinedSublingualImmunotherapyELearning =
            row.isJoinedSublingualImmunotherapyELearning === 1 ? "済" : "未";
        });

        const fields = fieldsDoctorsCsv();
        const filename = [
          "医師情報一覧_",
          `${moment().format("HH")}時${moment().format("mm")}分.CSV`,
        ].join("");

        await uploadAWS(filename, fields, lstUniq);
      } catch (error) {
        console.error("Error in uploadAcceptedWorkSchedules:", error);
      }
    }

    // 7
    async function uploadConversations() {
      try {
        const lastestConversation = await queryDatabase(
          connectionInstance,
          sqlSelectConversations()
        );

        const data = [];
        for await (const conversation of lastestConversation) {
          const fiveLastestConversationContent = await queryDatabase(
            connectionInstance,
            sqlSelectConversationContents(conversation.id)
          );
          const row = {
            doctorNameKana: `${conversation.lastnameKana} ${conversation.firstnameKana}`,
            doctorPhone: conversation.phoneNumber,
            sendingTime1: "",
            createdBy1: "",
            content1: "",
            sendingTime2: "",
            createdBy2: "",
            content2: "",
            sendingTime3: "",
            createdBy3: "",
            content3: "",
            sendingTime4: "",
            createdBy4: "",
            content4: "",
            sendingTime5: "",
            createdBy5: "",
            content5: "",
          };

          fiveLastestConversationContent.forEach((item, index) => {
            row[`sendingTime${index + 1}`] = moment(item.createdAt).format(
              "YYYY-MM-DD HH:mm"
            );
            row[`createdBy${index + 1}`] = item.isCreatedByStaff
              ? "医師"
              : "スタッフ";
            row[`content${index + 1}`] = item.message;
          });
          data.push(row);
        }

        const fields = fieldConversationsCsv();
        const filename = [
          "お問い合わせ管理_",
          `${moment().format("HH")}時${moment().format("mm")}分.CSV`,
        ].join("");

        await uploadAWS(filename, fields, data);
      } catch (error) {
        console.error("Error in uploadAcceptedWorkSchedules:", error);
      }
    }

    // await uploadAcceptedWorkSchedules();
    // await uploadSatisfieldshifts();
    // await uploadUnfulfilledshifts();
    // await uploadAvailableshifts();
    // await uploadWorkSchedules();
    // await uploadDoctors();
    await uploadConversations();

    // Close the connection after each use
    connectionInstance.end();
  }

  main();
} catch (error) {
  console.log("error", error);
}
// };
