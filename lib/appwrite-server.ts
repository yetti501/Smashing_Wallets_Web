import { Client, Account, Users, Databases } from 'node-appwrite';

function envOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function createAdminClient() {
  const client = new Client()
    .setEndpoint(envOrThrow('NEXT_PUBLIC_APPWRITE_ENDPOINT'))
    .setProject(envOrThrow('NEXT_PUBLIC_APPWRITE_PROJECT_ID'))
    .setKey(envOrThrow('APPWRITE_API_KEY'));

  return {
    users: new Users(client),
    databases: new Databases(client),
  };
}

export function createSessionClient(jwt: string) {
  const client = new Client()
    .setEndpoint(envOrThrow('NEXT_PUBLIC_APPWRITE_ENDPOINT'))
    .setProject(envOrThrow('NEXT_PUBLIC_APPWRITE_PROJECT_ID'))
    .setJWT(jwt);

  return {
    account: new Account(client),
  };
}

export function createPublicClient() {
  const client = new Client()
    .setEndpoint(envOrThrow('NEXT_PUBLIC_APPWRITE_ENDPOINT'))
    .setProject(envOrThrow('NEXT_PUBLIC_APPWRITE_PROJECT_ID'));

  return {
    account: new Account(client),
  };
}
