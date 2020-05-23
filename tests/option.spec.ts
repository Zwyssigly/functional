import { None, Some, AsyncOption } from '../src/option'

describe('Option', () => {
  test('None.match calls onNone', () => {
    const onNone = jest.fn();    
    None.match(_ => fail('onSome got called'), onNone);
    expect(onNone).toBeCalled();
  });
  test('None.ifNone is called once', () => {
    const onNone = jest.fn();    
    None.ifNone(onNone);
    expect(onNone).toBeCalled();
  });
  test('None.ifSome is never called', () => {
    None.ifSome(_ => fail('onSome got called'));
  });
  test('Some.match calls onSome', () => {
    const onSome = jest.fn();
    Some('').match(onSome, () => fail('onSome got called'));    
    expect(onSome).toBeCalled();
  });
  test('Some(x).match calls onSome with x', () => {
    Some('test').match(x => expect(x).toBe('test'), () => fail('onSome got called'));    
  });
  test("asdsd", async () => {
    let number = await None.orThenAsync(() => Promise.resolve(Some(1))).map(n => n + 1).unwrapOr(() => 0);
    expect(number).toBe(3);
  })
})