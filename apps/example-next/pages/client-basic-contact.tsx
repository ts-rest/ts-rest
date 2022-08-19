import { clientNest } from '../api';

const handleUpdateUserResponse = (
  res: Awaited<ReturnType<typeof clientNest.basicContract.updateUser>>
) => {
  if (res.status === 200) {
    console.log('200', res.data);
  } else if (res.status === 400) {
    console.log('400', res.data);
  } else {
    console.log('else', res.data);
  }
};

export const Index = () => {
  const updateUser = async () => {
    const badResponse = await clientNest.basicContract.updateUser({
      body: {
        name: 'John Doe',
        email: 'bad-name',
      },
      params: {
        id: 'cl61gznu7000109la4ngq97zk',
      },
    });

    handleUpdateUserResponse(badResponse);

    const goodResponse = await clientNest.basicContract.updateUser({
      body: {
        name: 'John Doe',
        email: 'good-name',
      },
      params: {
        id: 'cl61gznu7000109la4ngq97zk',
      },
    });

    handleUpdateUserResponse(goodResponse);

    const internalServerErrorResponse =
      await clientNest.basicContract.updateUser({
        body: {
          name: 'John Doe',
          email: 'internal-server-error',
        },
        params: {
          id: 'cl61gznu7000109la4ngq97zk',
        },
      });

    handleUpdateUserResponse(internalServerErrorResponse);
  };

  return (
    <div>
      <button onClick={() => updateUser()}>update user</button>
    </div>
  );
};

export default Index;
