import Compound from '@compound-finance/compound-js'


const provider = 'https://mainnet.infura.io/v3/39256b0351b7466286f799313a53d200';


const comptroller = Compound.util.getAddress(Compound.Comptroller);

const opf = Compound.util.getAddress(Compound.PriceFeed);

const cTokenDecimals = 8;

const blocksPerDay = 4 * 60 * 24;
const dayPerYear = 365;

const ethMantissa = Math.pow(10, 18);


async function calculateSupplyApy(cToken) {
	const supplyRatePerBlock = await Compound.eth.read(cToken, 'function supplyRatePerBlock() returns(uint)', [], {provider});

	return 100 * (Math.pow((supplyRatePerBlock / ethMantissa * blocksPerDay) + 1, dayPerYear - 1) - 1);
}


async function calculateCompApy(cToken, ticker, underlyingDecimals) {
	let compSpeed = await Compound.eth.read(comptroller, 'function compSpeed(address cToken) public view returns(uint)', [cToken], {provider} );

	let compPrice = await Compound.eth.read(opf, 'function price(string memory symbol) external view returns(uint)', [Compound.COMP], {provider});

	let underlyingPrice = await Compound.eth.read(opf, 'function price(string memory symbol) external view returns(uint)', [ticker], {provider});

	let totalSupply = await Compound.eth.read(cToken, 'function totalSupply() public view returns(uint)', [], {provider});

	let exchangeRate = await Compund.eth.read(cToken, 'function exchangeRateCurrent() public returns(uint)', [], {provider});

	compSpeed = compSpeed / 1e18;
	compPrice = compPrice / 1e6;
	underlyingPrice = underlyingPrice / 1e6;
	exchangeRate = +exchangeRate.toString() / ethMantissa;
	totalSupply = +totalSupply().toString() * exchangeRate * underlyingPrice / Math.pow(10, underlyingDecimals);
	const compPerDay = compSpeed * blocksPerDay;

	return 100 * (compPrice * compPerDay / totalSupply) * 365;
}


async function calculateApy(cTokenTicker, underlyingTicker) {
	const underlyingDecimals = Compound.decimals[cTokenTicker];
	const cTokenAddress = Compound.util.getAddress(cTokenTicker);
	const [supplyApy, compApy] = await Promise.all([
		calculateSupplyApy(cTokenAddress),
		calculateCompApy(cTokenAddress, underlyingTicker, underlyingDecimals)
		]);

	return {ticker: underlyingTicker, supplyApy, compApy};
}


export default calculateApy;
