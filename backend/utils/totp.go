package utils

import (
	"github.com/pquerna/otp/totp"
)

func GenerateTOTPSecret(username string) (string, string, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Backend App",
		AccountName: username,
	})
	if err != nil {
		return "", "", err
	}

	return key.Secret(), key.URL(), nil
}

func ValidateTOTP(secret, code string) bool {
	return totp.Validate(code, secret)
}
