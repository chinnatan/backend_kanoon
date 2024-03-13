export default class StringUtil {
  static isNullOrEmpty(str: string | null | undefined) {
    if (str === "" || str === null || str === undefined) {
      return true;
    }
    return false;
  }
}
