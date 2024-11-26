import express, { Request, Response, ErrorRequestHandler } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes/routes';
import rateLimit from 'express-rate-limit'; // Middleware para limitar as requisições
import winston from 'winston'; // Para logs
dotenv.config();

const server = express();

// Logger de auditoria com o Winston
const logger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'audit.log' }), // Arquivo de log de auditoria
    ],
  });

  // Limitando as requisições para evitar ataques DDoS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // Limita a 100 requisições por IP
    message: 'Limite de requisições excedido. Tente novamente mais tarde.',
  });

server.use(cors());

// Middleware para limitação de requisições
server.use(limiter);

// Middleware para registrar as requisições recebidas
server.use((req: Request, res: Response, next) => {
    const { method, url } = req;
    logger.info(`Recebida requisição: ${method} ${url}`); // Log da requisição
    next();
  });

server.use(express.static(path.join(__dirname, '../public')));

//AQUI EU DIGO O FORMATO QUE EU QUERO A REQUISIÇÃO
//server.use(express.urlencoded({ extended: true })); // USANDO URL ENCODED
server.use(express.json()); //USANDO JSON

server.get('/ping', (req: Request, res: Response) => res.json({ pong: true }));

server.use(apiRoutes);

server.use((req: Request, res: Response) => {
    res.status(404);
    res.json({ error: 'Endpoint não encontrado.' });
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    res.status(400); // Bad Request
    console.log(err);
    res.json({ error: 'Ocorreu algum erro.' });
}
server.use(errorHandler);

server.listen(process.env.PORT);