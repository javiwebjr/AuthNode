import { JwtAdapter, bcryptAdapter, envs } from "../../config";
import { UserModel } from "../../data";
import { CustomError, LoginUserDto, RegisterUserDto, UserEntity } from "../../domain";
import { EmailService } from "./email.service";

export class AuthService {
    constructor(
        private readonly emailService: EmailService,
    ) {}

    public async registerUser(registerUserDto: RegisterUserDto) {
        const existUser = await UserModel.findOne({email: registerUserDto.email});

        if(existUser) throw CustomError.badRequest('Email Registered');
        try {
            const user = new UserModel(registerUserDto);
            
            //Encriptar contraseña
            user.password = bcryptAdapter.hash(registerUserDto.password);
            
            await user.save();

            this.sendEmailValidation(user.email);

            //JWT sesion
            const token = await JwtAdapter.generateToken({id: user.id});
            if(!token) throw CustomError.internalServer('Error generating JWT');


            const {password, ...userEntity} = UserEntity.fromObj(user);

            return { user: userEntity, token: token };
        } catch (error) {
            throw CustomError.internalServer(`${error}`);   
        }
    }

    public async loginUser(loginUserDto: LoginUserDto) {
        //findone
        const existUser = await UserModel.findOne({email: loginUserDto.email});
        if(!existUser) throw CustomError.badRequest('Email Not Registered');

        const isMatching = bcryptAdapter.compare(loginUserDto.password, existUser.password);
        if(!isMatching) throw CustomError.badRequest('Password is not valid');

        const { password, ...userEntity } = UserEntity.fromObj(existUser);

        const token = await JwtAdapter.generateToken({id: existUser.id});
        if(!token) throw CustomError.internalServer('Error generating JWT');

        return {
            user: userEntity,
            token: token
        }
    }

    private sendEmailValidation = async (email: string) => {
        const token = await JwtAdapter.generateToken({email});
        if(!token) throw CustomError.internalServer('Error getting token');

        const link = `${envs.WEBSERVICE_URL}/auth/validate-email/${token}`;
        const html = `
            <h1>Confirm Your Email</h1>
            <br/>
            <p>Click on the link below to confirm your email</p>
            <a href="${link}">Validate Email</a>
        `;

        const options = {
            to: email,
            subject: 'Validate Your Email',
            htmlBody: html,
        }

        const sentMail = await this.emailService.sendEmail(options);
        if(!sentMail) throw CustomError.internalServer('Error sending email');

        return true;
    }

    public validateEmail = async (token: string) => {
        const payload = await JwtAdapter.validateToken(token);
        if(!payload) throw CustomError.badRequest('Token not valid');

        const {email} = payload as {email: string};
        if(!email) throw CustomError.internalServer('Payload token and email error');

        const user = await UserModel.findOne({email});
        if(!user) throw CustomError.internalServer('Email not exist');

        user.emailValidated = true;
        await user.save();

        return true;
    }
}