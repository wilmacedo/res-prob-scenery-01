const path = require('path');
const Generator = require('objects-to-csv');
const Parser = require('csvtojson');

const getCitizens = async () => {
  const terms = {
    saude: 'health',
    educacao: 'education',
    mobilidade: 'mobility',
  };
  const object = Object.keys(terms);

  const citizens = {};

  for (let i = 0; i < object.length; i++) {
    citizens[terms[object[i]]] = await Parser().fromFile(
      path.join(__dirname, 'db', `${object[i]}.csv`),
    );
  }

  return citizens;
};

const filterBySingleRule = (primaryDb, secondaryDb) => {
  const result = primaryDb.filter(citizen => {
    const filtered = secondaryDb.filter(person => citizen.Nome === person.Nome);

    return filtered.length === 0;
  });

  return result;
};

const filter = (type, databases) => {
  const primaryDb = databases[0];
  const secondaryDb = databases[1];
  const thirdDb = databases[2];

  const result = primaryDb.filter(citizen => {
    const filtered = secondaryDb.filter(person => citizen.Nome === person.Nome);
    let lastFiltered;

    if (thirdDb) {
      lastFiltered = thirdDb.filter(person => citizen.Nome === person.Nome);
    }

    if (type === 'contains one') {
      return filtered.length > 0;
    } else if (type === 'contains many') {
      return filtered.length > 0 && lastFiltered.length > 0;
    } else if (type === 'contains some') {
      return filtered.length > 0 && lastFiltered.length === 0;
    } else if (type === 'contains some one') {
      return filtered.length === 0 && lastFiltered.length === 0;
    } else {
      return filtered.length === 0;
    }
  });

  return result;
};

try {
  (async () => {
    const { health, education, mobility } = await getCitizens();

    const files = [
      {
        name: 'Educação',
        list: filter('contains nothing', [education, health]),
      },
      {
        name: 'Saúde',
        list: filter('contains nothing', [health, mobility]),
      },
      {
        name: 'Mobilidade',
        list: filter('contains nothing', [mobility, health]),
      },
      {
        name: 'Educação e Saúde',
        list: filter('contains one', [education, health]),
      },
      {
        name: 'Educação e Mobilidade',
        list: filter('contains one', [education, mobility]),
      },
      {
        name: 'Saúde e Mobilidade',
        list: filter('contains one', [health, mobility]),
      },
      {
        name: 'Saúde, Mobilidade e Educação',
        list: filter('contains many', [health, mobility, education]),
      },
      {
        name: 'Saúde (Exceto Mobilidade)',
        list: filter('contains some', [health, health, mobility]),
      },
      {
        name: 'Saúde (Exceto Educação)',
        list: filter('contains some', [health, health, education]),
      },
      {
        name: 'Saúde (Exceto Educação e Mobilidade)',
        list: filter('contains some one', [health, education, mobility]),
      },
    ];

    files.forEach(file => {
      new Generator(file.list).toDisk(
        path.join(__dirname, 'dist', `${file.name}.csv`),
      );
    });
  })();
} catch (error) {
  console.warn(`Unable to generate CSV. \n${error}`);
}
