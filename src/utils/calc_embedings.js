import * as tsne from '@tensorflow/tfjs-tsne';
import * as tf from '@tensorflow/tfjs-core';

const get_embedings_from_server = entries => {
  let unique_words = new Set();
  entries.forEach(entry => {
    entry.name.split(' ').forEach(word => {
      unique_words.add(word);
    });
  });

  return Promise.all(
    Array.from(unique_words).map(entry =>
      fetch(
        `http://localhost:5000/word2vec/model?word=${entry
          .toLowerCase()
          .replace(/[\W_]+/g, '')}`,
      ).then(r => r.json()),
    ),
  );
};

const vec_mag = vec => Math.sqrt(vec.reduce((mag, v) => mag + v * v, 0));

const norm_vec = vec => {
  const mag = vec_mag(vec);
  return vec.map(v => v / mag);
};

const category_mean = (entries, embeddings) => {
  const entry_embeddings = entries
    .map(entry => embeddings.find(emb => entry === emb.entry))
    .filter(a => a);

  const total_vec = entry_embeddings.reduce((total, embed) => {
    const vec = embed.embed;
    if (total.length == 0) {
      total = vec;
    } else {
      total = vec.map((v, i) => v + vec[i]);
    }
    return total;
  }, []);

  return norm_vec(total_vec);
};

const vec_dist2 = (v1, v2) =>
  v1.reduce((total, v, index) => total + (v - v2[index]) * (v - v2[index]), 0);

export const most_similar_to_category_mean = (entries, search_entries, embeddings) => {
  const mean = category_mean(entries, embeddings);

  const distances = search_entries.map(entry => {
    const embeding = embeddings.find(e => e.entry == entry.name).embed
    const dist = vec_dist2(embeding, mean);
    return {suggestion: entry.name, dist: dist};
  });


  return distances.filter(a=> a.dist > 0).sort((a, b) => (a.dist > b.dist ? 1 : -1)).slice(0, 5);
};

const combined_word_embedings_for_entry = (
  entry,
  word_embedings,
  norm = false,
) =>
  entry.name.split(' ').reduce((full_embed, word) => {
    const word_embed = word_embedings.find(
      we => we.word == word.toLocaleLowerCase(),
    );
    if (word_embed) {
      let rep = word_embed.rep;
      if (norm) {
        rep = norm_vec(rep);
      }

      if (full_embed.length == 0) {
        full_embed = rep;
      } else {
        full_embed = full_embed.map((v, i) => v + rep[i]);
      }
    }
    return full_embed;
  }, []);

export const calc_embedings = entries =>
  get_embedings_from_server(entries).then(word_embedings =>
    entries.map(entry => ({
      entry: entry.name,
      embed: combined_word_embedings_for_entry(entry, word_embedings),
    })),
  );

export const tsne_coords = words => {
  const coords = words.map(w => w.rep).filter(w => w);
  console.log('coords ', coords, coords.length, coords[0].length);
  const tsneOpt = tsne.tsne(tf.tensor(coords));
  return tsneOpt.compute().then(() => {
    const coordinates = tsneOpt.coordinates();
    coordinates.print();
    return coordinates;
  });
};