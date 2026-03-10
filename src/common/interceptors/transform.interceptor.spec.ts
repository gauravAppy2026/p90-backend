import { TransformInterceptor } from './transform.interceptor';
import { of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  const context = {} as ExecutionContext;

  it('should wrap plain data in standard response', (done) => {
    const handler: CallHandler = { handle: () => of({ id: 1, name: 'Test' }) };
    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.message).toBe('Success');
      expect(result.data).toEqual({ id: 1, name: 'Test' });
      done();
    });
  });

  it('should extract message and data from service response', (done) => {
    const handler: CallHandler = { handle: () => of({ message: 'Created', data: { id: 1 } }) };
    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.message).toBe('Created');
      expect(result.data).toEqual({ id: 1 });
      done();
    });
  });
});
