const SALT_PASSWORD = "i$chGpjy&3fjfYaa";
const SALT_VERIFY = "WQ&n%Yp5fgJzYHcF";

const form = document.querySelector("#calculator-form");
const deviceIdInput = document.querySelector("#device-id");
const localKeyInput = document.querySelector("#local-key");
const timestampInput = document.querySelector("#timestamp");
const timeInvalidSelect = document.querySelector("#time-invalid");
const customInvalidField = document.querySelector("#custom-invalid-field");
const customInvalidInput = document.querySelector("#custom-invalid");
const challengeCodeInput = document.querySelector("#challenge-code");
const passwordArrayOutput = document.querySelector("#password-array");
const verifyCodeOutput = document.querySelector("#verify-code");
const onlinePasswordOutput = document.querySelector("#online-password");
const useNowButton = document.querySelector("#use-now");

const encoder = new TextEncoder();

function nowTimestamp() {
  return Math.floor(Date.now() / 1000);
}

async function sha256Hex(input) {
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeTimeInvalid(value) {
  if (value === "10" || value === "30") {
    return parseInt(value, 10) * 60;
  }
  const customValue = Number.parseInt(customInvalidInput.value, 10);
  return Number.isFinite(customValue) && customValue > 0 ? customValue : 10;
}

async function BL_password_calculate(deviceId, localKey, timestamp, timeInvalid) {
  const timeInvalidSeconds = normalizeTimeInvalid(timeInvalid);
  const currentRoundTime =
    Math.floor(Number(timestamp) / timeInvalidSeconds) * timeInvalidSeconds;
  const preSha256Str = `${SALT_PASSWORD}-${deviceId}-${localKey}-${currentRoundTime}`;
  const hashResult = await sha256Hex(preSha256Str);

  const passwordArray = [];
  for (let i = 0; i < 8; i += 1) {
    const tempStr = hashResult.slice(i * 8, i * 8 + 8);
    const tempInt = Number.parseInt(tempStr, 16);
    let tempPasswdStr = `${tempInt}`;
    if (tempPasswdStr.length < 6) {
      tempPasswdStr = `000000${tempPasswdStr}`;
    }
    passwordArray.push(tempPasswdStr.slice(-6));
  }
  return passwordArray;
}

async function BL_verifyCode_calculate(deviceId, localKey, timestamp, challengeCode) {
  const currentRoundTime = Math.floor(Number(timestamp) / 600) * 600;
  const preSha256Str = `${SALT_VERIFY}-${deviceId}-${localKey}-${challengeCode}-${currentRoundTime}`;
  const hashResult = await sha256Hex(preSha256Str);
  return hashResult.slice(-16);
}

async function create_online_passwd_calculate(
  deviceId,
  localKey,
  timestamp,
  challengeCode
) {
  const currentRoundTime = Math.floor(Number(timestamp) / 600) * 600;
  const preSha256Str = `${SALT_VERIFY}-${deviceId}-${localKey}-${challengeCode}-${currentRoundTime}`;
  const hashResult = await sha256Hex(preSha256Str);
  const verifyCode = hashResult.slice(0, 8);
  const verifyCodeInt = Number.parseInt(verifyCode, 16);
  let output = `${verifyCodeInt % 1000000}`;
  if (output.length < 6) {
    output = `000000${output}`;
  }
  return output.slice(-6);
}

function setCurrentTimestamp() {
  timestampInput.value = nowTimestamp();
}

function toggleCustomInvalid() {
  const isCustom = timeInvalidSelect.value === "custom";
  customInvalidField.hidden = !isCustom;
}

async function handleSubmit(event) {
  event.preventDefault();
  const deviceId = deviceIdInput.value.trim();
  const localKey = localKeyInput.value.trim();
  const timestamp = timestampInput.value.trim();
  const timeInvalid = timeInvalidSelect.value;
  const challengeCode = challengeCodeInput.value.trim();

  if (!deviceId || !localKey || !timestamp) {
    return;
  }

  const passwordArray = await BL_password_calculate(
    deviceId,
    localKey,
    timestamp,
    timeInvalid
  );
  const verifyCode = await BL_verifyCode_calculate(
    deviceId,
    localKey,
    timestamp,
    challengeCode
  );
  const onlinePassword = await create_online_passwd_calculate(
    deviceId,
    localKey,
    timestamp,
    challengeCode
  );

  passwordArrayOutput.value = passwordArray.join("\n");
  verifyCodeOutput.value = verifyCode;
  onlinePasswordOutput.value = onlinePassword;
}

form.addEventListener("submit", handleSubmit);
useNowButton.addEventListener("click", () => {
  setCurrentTimestamp();
});
timeInvalidSelect.addEventListener("change", toggleCustomInvalid);

toggleCustomInvalid();
setCurrentTimestamp();
