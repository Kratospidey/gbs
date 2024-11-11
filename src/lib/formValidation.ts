class FormValidator {
	private validators: { [key: string]: RegExp } = {};

	constructor() {
		this.initializeValidators();
	}

	private initializeValidators(): void {
		this.validators["email"] = new RegExp(
			"^([a-zA-Z0-9_\\.-]+)@([a-zA-Z0-9_\\.-]+)\\.([a-z\\.]{2,6})$"
		);
		this.validators["password"] = new RegExp(
			"^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#\\$%\\^&\\*])(?=.{8,})"
		);
		this.validators["username"] = new RegExp("^[a-zA-Z0-9]{5,12}$");
	}

	public validate(field: string, value: string): boolean {
		if (this.validators[field]) {
			return this.validators[field].test(value);
		}
		return false;
	}
}

const formValidator = new FormValidator();

const isEmailValid = formValidator.validate("email", "example@example.com");
const isPasswordValid = formValidator.validate("password", "Passw0rd!");
const isUsernameValid = formValidator.validate("username", "username123");
