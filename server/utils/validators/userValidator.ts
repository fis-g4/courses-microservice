import { IUser, PlanType, User, UserRole } from '../../db/models/user'
import { Response } from 'express'
import { userErrors } from '../errorMessages/users'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function validateUser(
    user: IUser,
    res: Response,
    updating: boolean = false
) {
    if (!user) {
        res.status(400).send({ error: 'No user data sent!' })
    } else if (
        user.firstName.trim().length < 3 ||
        user.firstName.trim().length > 40
    ) {
        res.status(400).send({ error: userErrors.firstNameError })
    } else if (
        user.lastName.trim().length < 3 ||
        user.lastName.trim().length > 40
    ) {
        res.status(400).send({ error: userErrors.lastNameError })
    } else if (
        user.username.trim().length < 3 ||
        user.username.trim().length > 40
    ) {
        res.status(400).send({ error: userErrors.usernameError })
    } else if (!EMAIL_REGEX.test(user.email.trim())) {
        res.status(400).send({ error: userErrors.invalidEmailFormatError })
    } else if (
        (await User.findOne({ username: user.username.trim() })) !== null &&
        !updating
    ) {
        res.status(400).send({ error: userErrors.existingUsernameError })
    } else if (
        (await User.findOne({ email: user.email.trim() })) !== null &&
        !updating
    ) {
        return res.status(400).send({ error: userErrors.existingEmailError })
    } else if (user.coinsAmount < 0) {
        return res.status(400).send({ error: userErrors.invalidCoinsAmountError })
    } else if (!Object.values(PlanType).includes(user.plan)) {
        res.status(400).send({ error: userErrors.invalidPlanError })
    } else if (!Object.values(UserRole).includes(user.role)) {
        res.status(400).send({ error: userErrors.invalidRoleError })
    }
}

export { validateUser }
