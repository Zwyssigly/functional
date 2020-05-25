# Introduction
Functional is a package to improve your code stability and make your code more explicit, by adopting two common monads Option and Result from functional languages like Rust.

## Installation
`npm install @zwyssigly/functional --save`

## Examples
```javascript
// import stuff
import { Result, Ok, Err } from '@zwyssigly/functional'

// function returning Result
function parseDate(value: string | undefined) : Result<Date, string>{
	if (!value)
		return Err('Can not convert falsable to a date')

	let number = Date.parse(value);
	if (isNan(number))
		return Err('Can not parse string as date')
	
	return Ok(new Date(number));
}

// async function returning Result
function saveDate(value: Date) : Promise<Result<Date, string> {
	// your persistance logic
	return Ok(value);
}

// putting it together in an express endpoint
app.post('/api/date', async (req, res) => {
	await parseDate(req.body.date)
		.andThenAsync(date => saveDate(date))
		.match<void>(ok => res.send(ok), err => res.status(400).send(err));
});
```

## Option

