/**
 * Receber code(string)
 * Recuperar o access_token no github
 * Recuperar informações do usuário no github
 * Verificar se o usuário existe no banco de dados
 * ---- SIM = gera um token
 * ---- NÃO = cria no DB, gera um token
 * Retornar o token com as informações do usuário
 */

import axios from "axios";

import prismaCliente from "../prisma";
import { sign } from "jsonwebtoken";

interface IAccessTokenResponse {
  access_token: string;
}

interface IUserResponse {
  id: number;
  name: string;
  login: string;
  avatar_url: string;
}

class AuthenticateUserService {
  async execute(code: string) {
    const url = "https://github.com/login/oauth/access_token";

    const { data: accessTokenReponse } = await axios.post<IAccessTokenResponse>(
      url,
      null,
      {
        params: {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        headers: {
          accept: "application/json",
        },
      }
    );

    const response = await axios.get<IUserResponse>(
      "https://api.github.com/user",
      {
        headers: {
          authorization: `Bearer ${accessTokenReponse.access_token}`,
        },
      }
    );

    const { login, id, avatar_url, name } = response.data;

    let user = await prismaCliente.user.findFirst({
      where: {
        github_id: id,
      },
    });

    if (!user) {
      user = await prismaCliente.user.create({
        data: {
          github_id: id,
          name,
          login,
          avatar_url,
        },
      });
    }

    const token = sign(
      {
        user: {
          name: user.name,
          avatar_url: user.avatar_url,
          id: user.id,
        },
      },
      process.env.JWT_SECRET,
      {
        subject: user.id,
        expiresIn: "1d",
      }
    );

    return { token, user }; //1:11
  }
}

export { AuthenticateUserService };
