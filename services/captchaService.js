const fetch = require('node-fetch');

module.exports = app => {
    
    checkCaptchaResponse = async (req, res) => {
        if(req.fields['g-recaptcha-response'] === undefined || req.fields['g-recaptcha-response'] === '' || req.fields['g-recaptcha-response'] === null) {
            return res.json({"responseError" : "Please select captcha first"});
        }

        const secretKey = process.env.RECAPTCHA_KEY;
        const verificationURL = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.fields['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;

        const response = await fetch(verificationURL);
        const captchaSuccess = await response.json();
        res.send(captchaSuccess);
    }

    app.post('/api/checkCaptcha', checkCaptchaResponse);
}