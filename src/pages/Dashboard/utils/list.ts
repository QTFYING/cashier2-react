export async function getListById(id: number): Promise<string[]> {
  const data: Record<number, string[]> = {
    1: ['a1', 'a2', 'a3'],
    2: ['b1', 'b2', 'b3', 'b4'],
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data[id]);
    }, 2000);
  });
}
