import { Request } from 'express'
import { IUser } from '../db/models/user'
import { GoogleAuth } from 'google-auth-library'

const authCredentials = new GoogleAuth({
    keyFilename: '../GoogleCloudKey.json',
})

function getTokenFromRequest(req: Request): string | undefined {
    let bearerHeader = req.headers['authorization'] as string
    let bearer: string[] = bearerHeader.split(' ')
    let bearerToken: string = bearer[1]

    return bearerToken
}

function generateToken(user: IUser) {

    return new Promise((resolve, reject) => {
        authCredentials
            .getIdTokenClient(
                process.env.GCF_GENERATE_TOKEN_ENDPOINT ?? ''
            )
            .then((client) => {

                client.request({
                    method: 'POST',
                    url: process.env.GCF_GENERATE_TOKEN_ENDPOINT ?? '',
                    data: {
                        payload: {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            username: user.username,
                            email: user.email,
                            profilePicture: user.profilePicture,
                            coinsAmount: user.coinsAmount,
                            role: user.role,
                            plan: user.plan
                        }
                    }
                }).then((response) => {
                    let data: any = response.data
                    let token = data.data

                    resolve(token);
                }).catch((err) => {
                    reject(err);
                })

                
            })
    })
}

function verifyToken(url: string, token: string):  Promise<IUser> {

    return new Promise((resolve, reject) => {
        authCredentials
            .getIdTokenClient(
                process.env.GCF_VERIFY_TOKEN_ENDPOINT ?? ''
            )
            .then((client) => {

                client.request({
                    method: 'POST',
                    url: process.env.GCF_VERIFY_TOKEN_ENDPOINT ?? '',
                    data: {
                        url: url,
                        token: token
                    }
                }).then((response) => {
                    let data: any = response.data
                    let payload = data.data

                    resolve(payload);
                }).catch((err) => {

                    let statusCode = err.response.status;
                    let message = err.response.data.error

                    reject({statusCode, message});
                })

                
            })
    })
}

function getPayloadFromToken(token: string): Promise<IUser>{
    return new Promise((resolve, reject) => {
        authCredentials
            .getIdTokenClient(
                process.env.GCF_GET_PAYLOAD_FROM_TOKEN_ENDPOINT ?? ''
            )
            .then((client) => {

                client.request({
                    method: 'POST',
                    url: process.env.GCF_GET_PAYLOAD_FROM_TOKEN_ENDPOINT ?? '',
                    data: {
                        token: token
                    }
                }).then((response) => {
                    let data: any = response.data
                    let payload = data.data

                    resolve(payload);
                }).catch((err) => {
                    reject(err);
                })

                
            })
    })
}

export { generateToken, verifyToken, getPayloadFromToken, getTokenFromRequest }
