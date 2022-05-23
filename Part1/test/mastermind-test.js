const chai = require('chai');
const { resolve } = require('path');
const F1Field = require('ffjavascript').F1Field;
const Scalar = require('ffjavascript').Scalar;
exports.p = Scalar.fromString(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617',
);
const Fr = new F1Field(exports.p);

const wasm_tester = require('circom_tester').wasm;
const buildPoseidon = require('circomlibjs').buildPoseidon;

const assert = chai.assert;

describe("MastermindVariation", function () {
  let poseidon, F;

  before(async () => {
    poseidon = await buildPoseidon();
    F = poseidon.F;
  });
  it('Should test circuit', async () => {
    const circuit = await wasm_tester(
      resolve('./contracts/circuits/MastermindVariation.circom'),
    );

    const res = poseidon([7777777, 1, 2, 3, 4, 5]);
    console.log('res',res );
    let witness = await circuit.calculateWitness({
      pubGuessA: 1,
      pubGuessB: 2,
      pubGuessC: 3,
      pubGuessD: 4,
      pubGuessE: 5,
      privSolnA: 1,
      privSolnB: 2,
      privSolnC: 3,
      privSolnD: 4,
      privSolnE: 5,
      pubNumHit: 5,
      pubNumBlow: 0,
      pubSolnHash: F.toObject(res),
      privSalt: 7777777,
      },
      true,
    );
    console.log('witness',witness );

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(F.eq(F.e(witness[1]), F.e(res)));
    await circuit.assertOut(witness, { solnHashOut: F.toObject(res) });
    await circuit.checkConstraints(witness);

  });
  it("Should check wrong guessess", async () => {
    const circuit = await wasm_tester(
      resolve('./contracts/circuits/MastermindVariation.circom'),
    );

    const privSalt = Math.floor(Math.random()*10**10);
    const pubSolnHash = poseidon([privSalt, 1, 2 ,3 , 4, 5]);

    const INPUT = {
        "pubGuessA": 6,
        "pubGuessB": 7,
        "pubGuessC": 8,
        "pubGuessD": 9,
        "pubGuessE": 0,
        "pubNumHit": 0,
        "pubNumBlow": 0,
        "pubSolnHash": F.toObject(pubSolnHash),
        "privSolnA": 1,
        "privSolnB": 2,
        "privSolnC": 3,
        "privSolnD": 4,
        "privSolnE": 5,
        "privSalt" : privSalt
    }

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]),Fr.e(1)));
  });
});