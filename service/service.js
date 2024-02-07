import fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import path from 'node:path';
import 'dotenv/config';

// Функция для разбора файла на путь к нему, имя файла и расширение
// Возвращает новый путь к файлу вида <Старый путь>\<Имя файла>_<расширение файла>.<новое расширение>
const createOutputFilePath = (inputFilePath, outExt) => {
  // Получить путь к файлу без имени файла
  const fileDir = path.dirname(inputFilePath);

  // Получить имя файла без расширения
  const fileName = path.basename(inputFilePath, path.extname(inputFilePath));

  // Получить расширение файла
  const fileExtension = path.extname(inputFilePath).substring(1);

  // Формируем имя выходного файла согласно ТЗ
  const outputFileName = `${fileName}_${fileExtension}.${outExt}`;

  // Формируем путь к выходному файлу согласно ТЗ
  const outputFilePath = path.join(fileDir, outputFileName);
  console.log('outputFilePath: ', outputFilePath);
  return outputFilePath;
};

// Функция для создания хеш файла
export const createHashFile = async filePath => {
  const outExt = 'sha256';

  const fileContent = await fs.readFile(filePath);
  const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
  const hashFilePath = createOutputFilePath(filePath, outExt);
  process.env.HASH_FILE_PATH = hashFilePath;
  await fs.writeFile(hashFilePath, hash);
};

// Функция для сжатия файла
export const compressFile = async filePath => {
  const outExt = 'gz';

  const outputFilePath = createOutputFilePath(filePath, outExt);
  const readStream = createReadStream(filePath);
  const writeStream = createWriteStream(outputFilePath);
  process.env.GZ_FILE_PATH = outputFilePath;

  await new Promise((resolve, reject) => {
    readStream
      .pipe(zlib.createGzip())
      .on('error', reject)
      .pipe(writeStream)
      .on('error', reject)
      .on('finish', resolve);
  });
};

// Функция для распаковки файла и проверки целостности
export const unpackAndVerify = async () => {
  // Получаем путь к упакованному файлу
  const filePath = process.env.GZ_FILE_PATH;

  // Восстанавливаем оригинальное имя файла по шаблону, по которому создавали архивный файл
  const originFileName = path
    .basename(filePath, path.extname(filePath))
    .split('_')[0];

  // Отдельно получаем его расширение
  const originFileExt = path
    .basename(filePath, path.extname(filePath))
    .split('_')[1];

  // Формируем имя для распакованного файла, добавляя "_unpacked" к имени исходного файла
  const unpackedFileName = `${originFileName}_unpacked.${originFileExt}`;

  // Формируем полный путь к распакованному файлу
  const unpackedFilePath = path.join(path.dirname(filePath), unpackedFileName);

  // Читаем запакованный файл
  const readStream = createReadStream(filePath);

  // Pfgbcsdftv hfcgfrjdfyysq afqk c yjdsv bvtytv
  const writeStream = createWriteStream(unpackedFilePath);

  // Получаем путь к файлу хеша из переменной окружения, куда записали его, когда создавали файл хеша
  const hashFilePath = process.env.HASH_FILE_PATH;

  // Читаем хеш-файл
  const hash = await fs.readFile(hashFilePath, 'utf-8');

  // Читаем распакованный файл, вычисляем для него хеш и сравниваем с хешем исходного файла
  // Возвращаем булево значение, на основе которого выводим сообщение
  // об успешности или неудаче проверки целостности файла
  return new Promise((resolve, reject) => {
    readStream
      .pipe(zlib.createGunzip())
      .on('error', reject)
      .pipe(writeStream)
      .on('error', reject)
      .on('finish', async () => {
        const uncompressedFileContent = await fs.readFile(unpackedFilePath);
        const calculatedHash = crypto
          .createHash('sha256')
          .update(uncompressedFileContent)
          .digest('hex');
        resolve(calculatedHash === hash);
      });
  });
};
