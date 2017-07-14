/**
 * Get a Date instance object from a given value. This value should be a Date instance
 * or a string. If an invalid value is given it throws a TypeError.
 *
 * @param  {Date|String} value Value to get a new Date instance object
 * @return {Date}              Date instance object
 */
export default value => {
  let dateValue;

  if (value instanceof Date) {
    dateValue = value;
  } else if (typeof value === 'string') {
    dateValue = new Date(value);
  } else {
    throw new TypeError(`Protocol::setDateProperty invalid given date value ${value}`);
  }

  // Check if the given date (Date instance or string) is valid
  if (isNaN(dateValue.getTime())) {
    throw new TypeError(`Protocol::setDateProperty invalid given date ${value}`);
  }

  return dateValue;
};
