const userErrors = {
    firstNameError: 'The user\'s first name must be between 3 and 40 characters long',
    lastNameError: 'The user\'s last name must be between 3 and 40 characters long',
    usernameError: 'The username name must be between 3 and 40 characters long',
    invalidEmailFormatError: 'The email format is invalid',
    existingUsernameError: 'There is already a user with that username',
    existingEmailError: 'There is already a user with that email',
    invalidPlanError: 'The plan assigned to the user is not valid',
    invalidRoleError: 'The role assigned to the user is not valid',
    invalidUsernameOrPasswordError: 'The username or password is incorrect',
    userNotExistError: 'User does not exist!',
    noUserDataError: 'No user data sent!',
    cannotUpdateUserError: 'You are not authorized to update this user',
    invalidCoinsAmountError: 'The coinsAmount must be a positive number',
    invalidCurrentPasswordError: 'The current password of the user is incorrect, you cannot modify the password',
}

export { userErrors }