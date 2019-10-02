import React, {createContext, useContext, useReducer, useEffect} from 'react';
const uuidv1 = require('uuid/v1');

export const StateContext = createContext();

const initalState = {
  datasets: [],
  columns: [],
  entries: [],
  projects: [],
  mappings: [],
  embeddings: [],
  metaColumns: [],
  showUploadModal: false,
  showApplyMappingsModal: false,
  cache_loaded: false,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CACHED_STATE':
      return action.payload;

    case 'ADD_DATASETS':
      return {...state, datasets: [...state.datasets, ...action.payload]};

    case 'REMOVE DATASET':
      console.log();
      return {
        ...state,
        datasets: state.datasets.filter(d => d.id !== action.payload),
      };

    case 'ADD_EMBEDINGS':
      return {
        ...state,
        embeddings:action.payload
      }
    case 'ADD_COLUMNS':
      return {...state, columns: [...state.columns, ...action.payload]};

    case 'REMOVE COLUMN':
      return {
        ...state,
        columns: state.datasets.filter(c => c.id !== action.payload),
      };

    case 'ADD_ENTRIES':
      return {...state, entries: [...state.entries, ...action.payload]};

    case 'REMOVE ENTRY':
      return {
        ...state,
        entries: state.entries.filter(e => e.id !== action.payload),
      };

    case 'REMOVE_META_COLUMNS':
      return{
        ...state,
        metaColumns: state.metaColumns.filter( mc => !action.payload.includes(mc.id) )
      }
    case 'ADD_META_COLUMNS':
      return{
        ...state,
        metaColumns: [...state.metaColumns, ...action.payload]
      }

    case 'ADD_MAPPINGS':
      return {...state, mappings: [...state.mappings, ...action.payload]};

    case 'REMOVE_MAPPING':
      return {
        ...state,
        mappings: state.mappings.filter(m => m.id !== action.payload),
      };

    case 'ADD_MAPPING':
      return {
        ...state,
        mappings: [...state.mappings, action.payload],
      };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, {id: uuidv1(), ...action.payload}],
      };

    case 'REMOVE_PROJECT':
      return {
        ...state,
        projects: state.mappings.filter(p => p.id !== action.payload),
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id == action.payload.id ? {...p, ...action.payload} : p,
        ),
      };

    case 'ADD ENTRY TO MAPPING':
      return {
        ...state,
        mappings: state.mappings.map(m =>
          m.id === action.payload.id
            ? {...m, entries: [...m.entries, action.payload.entry]}
            : m,
        ),
      };

    case 'DELETE_MAPPING':
      return {
        ...state,
        mappings: state.mappings.filter(m => m.id !== action.payload),
      };
    case 'UPDATE_MAPPING':
      return {
        ...state,
        mappings: state.mappings.map(m =>
          m.id === action.payload.id ? {...m, ...action.payload.mapping} : m,
        ),
      };
    case 'UPDATE_META_COLUMN':
      return {
        ...state,
        meta_columns: state.metaColumns.map(mc =>
          mc.id === action.payload.id ? {...mc, ...action.payload.meta_column} : mc,
        ),
      };
    default:
      return state;
  }
};

export const StateProvider = ({children}) => {
  const [state, dispatch] = useReducer(reducer, initalState);
  useEffect(() => {
    if (state.cache_loaded) {
      localStorage.setItem('state', JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    console.log('State update ', state);
  }, [state]);

  useEffect(() => {
    const cachedState = JSON.parse(localStorage.getItem('state'));
    console.log('ATTEMPTING TO HYDRATE STATE', cachedState);

    dispatch({
      type: 'LOAD_CACHED_STATE',
      payload: {...initalState, ...cachedState, cache_loaded: true},
    });
  }, []);

  return (
    <StateContext.Provider value={[state, dispatch]}>
      {children}
    </StateContext.Provider>
  );
};
export const useStateValue = () => useContext(StateContext);

export const useProject = projectID => {
  const [state, dispatch] = useStateValue();
  const project = state.projects.find(p => p.id === projectID);
  const datasets = state.datasets.filter(d => d.project_id === projectID);
  const meta_columns = state.metaColumns.filter(mc=>mc.project_id===projectID)
  const meta_column_ids  = meta_columns.map(mc => mc.id)

  const colIDs = meta_columns.reduce( (ids, mc) => [...ids,...mc.columns] ,[] )
  const mappings  = state.mappings.filter(m=> meta_column_ids.includes(m.column_id) )
  const columns = state.columns.filter(c => colIDs.includes(c.id));
  return {project, datasets,meta_columns, columns,mappings};
};

export const useColumn = columnID => {
  const [state, dispatch] = useStateValue();
  const column = state.columns.find(c => c.id === columnID);
  const entries = state.entries.filter(e => e.column_id == columnID);
  const mappings = state.mappings.filter(m => m.column_id === columnID);
  const entry_names = entries.map((e)=>e.name)
  const embeddings = state.embeddings.filter(embed =>
    entry_names.includes(embed.entry),
  );
  return {column, entries, mappings, embeddings, dispatch};
};

export const useMetaColumn = columnID => {
  const [state, dispatch] = useStateValue();
  const meta_column = state.metaColumns.find(c => c.id === columnID);
  const entries = state.entries.filter(e => meta_column.columns.includes(e.column_id));

  // Need to consolidate the entries down to as single space.
  const entryNames  = Array.from(new Set(entries.map(e=>e.name)))
  const mergedEntry = entryNames.map( name =>{ 
    const entry_collection = entries.filter(e=>e.name===name)
    const total = entry_collection.reduce( (total,ec) => total+ec.count,0)
    return {
       name,
       count: total 
    }
  })

  const mappings = state.mappings.filter(m => m.column_id === meta_column.id);
  const entry_names = entries.map((e)=>e.name)
  const embeddings = state.embeddings.filter(embed =>
    entry_names.includes(embed.entry),
  );
  return {meta_column, entries : mergedEntry, mappings, embeddings, dispatch};
};

export const useDataset = datasetID => {
  const [state, dispatch] = useStateValue();
  const dataset = state.datasets.find(d => d.id === datasetID);
  const columns = state.columns.filter(d => d.dataset_id === datasetID);
  const columnIDs = columns.map(c => c.id);
  const mappings = state.mappings.filter(m => columnIDs.includes(m.columnID));
  return {dataset, columns, mappings};
};
