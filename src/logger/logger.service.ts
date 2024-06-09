import { Injectable, LoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CustomLogger implements LoggerService {
  private logFilePath: string;

  constructor() {
    const logDirectory = path.resolve(__dirname, '..', 'logs');
    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory);
    }
    this.logFilePath = path.resolve(logDirectory, 'application.log');
  }

  log(message: string) {
    this.writeLog('LOG', message);
  }

  error(message: string, trace: string) {
    this.writeLog('ERROR', `${message}\nTrace: ${trace}`);
  }

  warn(message: string) {
    this.writeLog('WARN', message);
  }

  debug(message: string) {
    this.writeLog('DEBUG', message);
  }

  verbose(message: string) {
    this.writeLog('VERBOSE', message);
  }

  private writeLog(level: string, message: string) {
    const logMessage = `${new Date().toISOString()} [${level}] ${message}\n`;
    fs.appendFileSync(this.logFilePath, logMessage);
  }
}
