export const getTimezones = () => {
  if (typeof Intl === "undefined" || !("supportedValuesOf" in Intl)) {
    return ["UTC"];
  }

  return Intl.supportedValuesOf("timeZone");
};
