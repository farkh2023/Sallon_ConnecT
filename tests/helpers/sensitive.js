const ABSOLUTE_PATH = /[A-Za-z]:\\|\/(?:Users|home|root|etc|var|tmp)\//;
const BEARER = /Bearer\s+[A-Za-z0-9._~+/=-]+/i;
const IMEI = /\b\d{15}\b/;
const FULL_LOCAL_IP = /\b(?:192\.168|10\.|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/;

function stringify(value) {
  return JSON.stringify(value);
}

function expectNoSensitiveLeak(value) {
  const text = stringify(value);
  expect(text).not.toMatch(BEARER);
  expect(text).not.toMatch(IMEI);
  expect(text).not.toMatch(ABSOLUTE_PATH);
  expect(text).not.toMatch(FULL_LOCAL_IP);
}

module.exports = {
  expectNoSensitiveLeak,
};
