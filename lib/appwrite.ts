import { Client, Account, Databases, Functions } from 'appwrite';

// Initialize the Appwrite client
const client = new Client();

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (endpoint && projectId) {
  client.setEndpoint(endpoint).setProject(projectId);
} else if (typeof window !== 'undefined') {
  // Only warn at runtime, not during static build
  console.error(
    'Missing Appwrite environment variables. Set NEXT_PUBLIC_APPWRITE_ENDPOINT and NEXT_PUBLIC_APPWRITE_PROJECT_ID.'
  );
}

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);

export { client };
export default client;
