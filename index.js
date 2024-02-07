import {
  compressFile,
  createHashFile,
  unpackAndVerify,
} from './service/service.js';

const filePath = './files/03.bmp';

const init = async () => {
  try {
    // Создание хеш файла и сжатие
    await createHashFile(filePath);
    console.log('Хеш файл создан успешно!');
    await compressFile(filePath);
    console.log('Файл сжат успешно!');

    // Распаковка и проверка целостности
    const isIntegrityVerified = await unpackAndVerify(filePath);
    if (isIntegrityVerified) {
      console.log('Распаковка и проверка целостности выполнены успешно!');
    } else {
      console.log('Ошибка: Не удалось проверить целостность файла.');
    }
  } catch (error) {
    console.error('Произошла ошибка:', error);
  }
};
init();
