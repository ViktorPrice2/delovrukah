export const revalidate = 0;

type User = {
  id: string;
  email: string;
};

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';

async function fetchUsers(): Promise<User[]> {
  const response = await fetch(`${apiBaseUrl}/users`, {
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error('Invalid response received from the server.');
  }

  return data;
}

export default async function UsersPage() {
  let users: User[] = [];
  let error: string | null = null;

  try {
    users = await fetchUsers();
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message
        : 'Unknown error occurred while fetching users.';
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold text-gray-900">Users</h1>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>
      ) : users.length === 0 ? (
        <p className="rounded-md border border-gray-200 bg-gray-50 p-4 text-gray-600">No users found.</p>
      ) : (
        <ul className="space-y-2 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          {users.map((user) => (
            <li key={user.id} className="text-gray-800">
              {user.email}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
