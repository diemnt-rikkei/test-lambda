import moment from "moment";
import 'moment-timezone';

const momentTokyo = moment.tz.setDefault("Asia/Tokyo");

export default momentTokyo;
