describe('$$mdTimeUtil', function() {
  // When constructing a Date, the month is zero-based. This can be confusing, since people are
  // used to seeing them one-based. So we create these aliases to make reading the tests easier.
  var JAN = 0, FEB = 1, MAR = 2, APR = 3, MAY = 4, JUN = 5, JUL = 6, AUG = 7, SEP = 8, OCT = 9,
      NOV = 10, DEC = 11;

  var timeUtil;

  beforeEach(module('material.components.timepicker'));

  beforeEach(inject(function($$mdTimeUtil) {
    timeUtil = $$mdTimeUtil;
  }));

  it('should check whether two times are the same time', function() {
    // Same exact day and time.
    var first = new Date(1900, JAN, 1, 20, 0, 0, 0);
    var second = new Date(1900, JAN, 1, 20, 0, 0, 0);
    expect(timeUtil.isSameTime(first, second)).toBe(true);

    // Same month and year, different day.
    first = new Date(1900, JAN, 1, 20, 0, 0, 0);
    second = new Date(1900, JAN, 2, 20, 0, 0, 0);
    expect(timeUtil.isSameTime(first, second)).toBe(true);

    // Same month, different year.
    first = new Date(1900, JAN, 1, 20, 0, 0, 0);
    second = new Date(1901, JAN, 1, 20, 0, 0, 0);
    expect(timeUtil.isSameTime(first, second)).toBe(true);

    // Same year, different month.
    first = new Date(1900, JAN, 1, 20, 0, 0, 0);
    second = new Date(1900, FEB, 1, 20, 0, 0, 0);
    expect(timeUtil.isSameTime(first, second)).toBe(true);

    // Different month and year.
    first = new Date(1900, JAN, 1, 20, 0, 0, 0);
    second = new Date(1901, FEB, 1, 20, 0, 0, 0);
    expect(timeUtil.isSameTime(first, second)).toBe(true);

    // Same day, different time.
    var first = new Date(1900, JAN, 1, 20, 0, 0, 0);
    var second = new Date(1900, JAN, 1, 21, 32, 50, 900);
    expect(timeUtil.isSameTime(first, second)).toBe(false);

    // Same day, different hour.
    var first = new Date(1900, JAN, 1, 20, 10, 40, 0);
    var second = new Date(1900, JAN, 1, 21, 10, 40, 0);
    expect(timeUtil.isSameTime(first, second)).toBe(false);

    // Same day, different minute.
    var first = new Date(1900, JAN, 1, 20, 25, 50, 900);
    var second = new Date(1900, JAN, 1, 20, 32, 50, 900);
    expect(timeUtil.isSameTime(first, second)).toBe(false);

    // Same day, different second.
    var first = new Date(1900, JAN, 1, 10, 32, 0, 362);
    var second = new Date(1900, JAN, 1, 10, 32, 50, 362);
    expect(timeUtil.isSameTime(first, second)).toBe(false);

    // Same day, different milliseconds.
    var first = new Date(1900, JAN, 1, 11, 0, 0, 0);
    var second = new Date(1900, JAN, 1, 11, 0, 0, 900);
    expect(timeUtil.isSameTime(first, second)).toBe(false);
  });

});
