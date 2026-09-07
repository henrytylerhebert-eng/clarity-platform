import { expect, it } from "vitest";
import {
  daysInPeriod,
  midnightEnding,
} from "../../packages/rev-ops-service/src/index.js";

it("labels the day just ended and respects leap years and facility DST", () => {
  expect(daysInPeriod("2028-02")).toBe(29);
  expect(midnightEnding("2028-02-01", "America/Chicago")).toBe(
    "2028-02-02T06:00:00.000Z",
  );
  const spring =
    Date.parse(midnightEnding("2028-03-12", "America/Chicago")) -
    Date.parse(midnightEnding("2028-03-11", "America/Chicago"));
  const autumn =
    Date.parse(midnightEnding("2028-11-05", "America/Chicago")) -
    Date.parse(midnightEnding("2028-11-04", "America/Chicago"));
  expect(spring / 3600000).toBe(23);
  expect(autumn / 3600000).toBe(25);
  expect(midnightEnding("2028-12-31", "Asia/Kolkata")).toBe(
    "2028-12-31T18:30:00.000Z",
  );
});
