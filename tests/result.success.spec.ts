import { Success } from '../src/result'

describe('Result.Success', () => {
  test('Success.match calls onSuccess', () => {
    const onSome = jest.fn();
    Success('').match(onSome, () => fail('onFailure got called'));    
    expect(onSome).toBeCalled();
  });
  test('Success(x).match calls onSuccess with x', () => {
    Success('test').match(x => expect(x).toBe('test'), () => fail('onFailure got called'));    
  });
});