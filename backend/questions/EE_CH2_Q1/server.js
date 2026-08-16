const math = require("mathjs");

const generate = (usePredefinedValues = false) => {
    const params = usePredefinedValues
        ? { V_source: 150, angle: 20, R1: 2, R2: 1, R3: 3, L: 4, C: 2 }
        : {
            V_source: math.randomInt(100, 201),
            angle: math.randomInt(0, 361),
            R1: math.randomInt(1, 11),
            R2: math.randomInt(1, 11),
            R3: math.randomInt(1, 11),
            L: math.randomInt(1, 11),
            C: math.randomInt(1, 11)
        };

    const { V_source, angle, R1, R2, R3, L, C } = params;
    const source = math.complex({
        r: V_source,
        phi: angle * Math.PI / 180
    });
    const zL = math.complex(0, L);
    const zC = math.complex(0, -C);

    // Nodal-admittance system for the two unknown node voltages.
    const a = math.add(1 / R1, math.divide(1, zL), 1 / R2, 1 / R3);
    const b = -1 / R3;
    const c = b;
    const d = math.add(1 / R3, math.divide(1, zC));
    const sourceCurrent = math.divide(source, R1);
    const determinant = math.subtract(math.multiply(a, d), math.multiply(b, c));

    if (math.abs(determinant) < 1e-12) {
        throw new Error("The generated nodal system is singular.");
    }

    const v1 = math.divide(math.multiply(sourceCurrent, d), determinant);
    const v2 = math.divide(math.multiply(-c, sourceCurrent), determinant);
    const io = math.divide(math.subtract(v1, v2), R3);

    return {
        params,
        correct_answers: { Io: math.round(math.abs(io), 3) },
        intermediate: {
            Io_real: math.round(io.re, 3),
            Io_imaginary: math.round(io.im, 3)
        },
        nDigits: 3,
        sigfigs: 3
    };
};

module.exports = { generate };
