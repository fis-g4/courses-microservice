interface FormInputs {
  email: string;
  password: string;
}

interface CourseFormInputs {
  name: string,
  description: string;
  price: number;
  categories: string[];
  language: string;
  creator: IUser;
}