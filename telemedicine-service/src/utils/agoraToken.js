const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

function generateToken(channelName, uid, _role = "publisher", expireTime = 3600) {
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    // Test-friendly fallback: if certificate flow is not configured,
    // callers can still join using appId + null token (insecure mode).
    if (!appID || !appCertificate) {
        return null;
    }

    const roleEnum = RtcRole.PUBLISHER;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + Number(expireTime);
    return RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelName,
        uid,
        roleEnum,
        privilegeExpiredTs
    );
}

module.exports = { generateToken };