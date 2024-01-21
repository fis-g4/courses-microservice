import express, { Request, Response } from 'express';
import { User, IUser, ObjectId, PlanType, UserRole } from '../db/models/user'; // Ajusta la importación según tu estructura

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
    const users = await User.find({});

    return res.status(200).json(users);
});

router.post('/login', async (req: Request, res: Response) => {
    const { email, password }: FormInputs = req.body;

    const user = await User.findOne({ email, password });

    if (!user) {
        return res.status(404).send('User Not Found!');
    }

    return res.status(200).json(user);
});

router.post('/', async (req: Request, res: Response) => {
    const {email, password }: FormInputs = req.body;

    const userObject: IUser = {
        name:  "Default User", // Establece un valor predeterminado si name no está presente
        email,
        password,
        firstName: "David", // Puedes proporcionar valores predeterminados o omitirlos según tus necesidades
        lastName: "Salazar",
        username: "davsal",
        profilePicture: "example.png",
        coinsAmount: 0,
        plan: PlanType.BASIC,
        role: UserRole.USER,
    };

    const user = User.build(userObject);

    try {
        await user.save();
        return res.status(201).json(user);
    } catch (error) {
        console.error('Error al guardar el usuario:', error);
        return res.status(500).send('Internal Server Error');
    }
});

export default router;
