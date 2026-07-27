import 'package:nepali_utils/nepali_utils.dart';
void main() {
  NepaliUtils(Language.english);
  var date = NepaliDateTime(2080, 1, 1);
  print('Weekday: ${date.weekday}');
  print('Total days: ${date.totalDays}');
  print('Month name: ${NepaliDateFormat.MMMM(Language.english).format(date)}');
}
