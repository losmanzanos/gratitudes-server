function makeGratitudesArray() {
  return [
    {
      id: 1,
      thankful_for: "Christmas",
      did_well: "I exercised...",
      achieve: "???",
      soc: "",
    },
  ];
}

function makeMaliciousGratitude() {
  const maliciousGratitude = {
    id: 911,
    thankful_for: 'Naughty naughty very naughty <script>alert("xss");</script>',
    did_well: "Hacks!",
    achieve: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    soc: "",
  };
  const expectedGratitude = {
    ...maliciousGratitude,
    thankful_for:
      'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
    achieve: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  };
  return {
    maliciousGratitude,
    expectedGratitude,
  };
}

module.exports = {
  makeGratitudesArray,
  makeMaliciousGratitude,
};
