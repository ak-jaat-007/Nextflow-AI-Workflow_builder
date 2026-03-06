export async function imageToBase64(url: string) {

  const res = await fetch(url);
  const blob = await res.blob();

  return new Promise<string>((resolve) => {

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result?.toString().split(",")[1];
      resolve(base64 || "");
    };

    reader.readAsDataURL(blob);

  });

}