declare namespace MpxStore {
  type UnboxDepField<D, F> = F extends keyof D ? D[F] : {}

  type UnboxDepsField<D extends Deps, F> = string extends keyof D ? {} : {
    [K in keyof D]: UnboxDepField<D[K], F>
  }

  type getMutation<M> = M extends (state: any, ...payload: infer P) => infer R ? (...payload: P) => R : never

  type getAction<A> = A extends (context: object, ...payload: infer P) => infer R ? (...payload: P) => R : never

  type Mutations<S> = {
    [key: string]: (this: void, state: S, ...payload: any[]) => any
  }

  type Getters<S> = {
    [key: string]: (this: void, state: S, getters: any, globalState: any) => any
  }

  type Actions<S, G extends Getters<S>> = {
    [key: string]: (this: void, context: {
      rootState: any,
      state: S,
      getters: GetGetters<G>,
      dispatch: (type: string, ...payload: any[]) => any,
      commit: (type: string, ...payload: any[]) => any
    }, ...payload: any[]) => any
  }

  type GetGetters<G> = {
    readonly [K in keyof G]: G[K] extends (state: any, getters: any, globalState: any) => infer R ? R : G[K]
  }

  type GetMutations<M> = {
    [K in keyof M]: getMutation<M[K]>
  }

  type GetActions<A> = {
    [K in keyof A]: getAction<A[K]>
  }

  type GetDispatch<A, D> = keyof D extends never ? (<T extends keyof A>(type: T, ...payload: A[T] extends (context: any, ...payload: infer P) => any ? P : never) => A[T] extends (context: any, ...payload: any[]) => infer R ? R : never) : ((type: string, ...payload: any[]) => any)

  type GetCommit<M, D> = keyof D extends never ? (<T extends keyof M>(type: T, ...payload: M[T] extends (state: any, ...payload: infer P) => any ? P : never) => M[T] extends (state: any, ...payload: any[]) => infer R ? R : never) : ((type: string, ...payload: any[]) => any)

  interface Deps {
    [key: string]: Store | StoreWithThis
  }


  type GetComputedSetKeys<T> = {
    [K in keyof T]: T[K] extends {
      get(): any,
      set(val: any): void
    } ? K : never
  }[keyof T]

  type GetComputedType<T> = {
    readonly [K in Exclude<keyof T, GetComputedSetKeys<T>>]: T[K] extends () => infer R ? R : T[K]
  } & {
      [K in GetComputedSetKeys<T>]: T[K] extends {
        get(): infer R,
        set(val: any): void
      } ? R : T[K]
    }

  interface MutationsAndActionsWithThis {
    [key: string]: (...payload: any[]) => any
  }

  type UnionToIntersection<U> = (U extends any
    ? (k: U) => void
    : never) extends ((k: infer I) => void)
    ? I
    : never;

  interface mapStateFunctionType<S, G> {
    [key: string]: (state: S, getter: G) => any
  }

  interface DeeperMutationsAndActions {
    [key: string]: ((...payload: any[]) => any) | MutationsAndActionsWithThis
  }

  // Store Type Bindings
  type StringKeyof<T> = Exclude<keyof T, symbol>

  type CombineStringKey<H extends string | number, L extends string | number> = H extends '' ? `${L}` : `${H}.${L}`

  type GetActionsKey<A, P extends string | number = ''> = UnionToIntersection<{
    [K in StringKeyof<A>]: {
      [RK in CombineStringKey<P, K>]: A[K] extends DeeperMutationsAndActions ? GetActionsKey<A[K], RK> : Record<RK, A[K]>
    }[CombineStringKey<P, K>]
  }[StringKeyof<A>]> // {actA: () => void, storeB.actB: () => void}

  type GetAllActionsKey<A, D extends Deps, AK extends 'actions' | 'mutations'> = {
    [K in StringKeyof<A>]: A[K]
  } & UnionToIntersection<{
    [K in StringKeyof<D>]: {
      [P in keyof GetActionsKey<D[K][AK], K>]: GetActionsKey<D[K][AK], K>[P]
    }
  }[StringKeyof<D>]>

  type GetDispatchAndCommitWithThis<A, D extends Deps, AK extends 'actions' | 'mutations'> = (<T extends keyof GetAllActionsKey<A, D, AK>>(type: T, ...payload: GetAllActionsKey<A, D, AK>[T] extends (...payload: infer P) => any ? P : never) => GetAllActionsKey<A, D, AK>[T] extends (...payload: any[]) => infer R ? R : never)

  interface StoreWithThis<S = {}, G = {}, M = {}, A = {}, D extends Deps = {}> {

    state: S & UnboxDepsField<D, 'state'>
    getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>
    mutations: M & UnboxDepsField<D, 'mutations'>
    actions: A & UnboxDepsField<D, 'actions'>

    dispatch: GetDispatchAndCommitWithThis<A, D, 'actions'>

    commit: GetDispatchAndCommitWithThis<M, D, 'mutations'>

    mapState<K extends keyof S>(maps: K[]): {
      [I in K]: () => S[I]
    }
    mapState(depPath: string, maps: string[]): {
      [key: string]: () => any
    }
    mapState<T extends mapStateFunctionType<S & UnboxDepsField<D, 'state'>, GetComputedType<G> & UnboxDepsField<D, 'getters'>>>(obj: ThisType<any> & T): {
      [I in keyof T]: ReturnType<T[I]>
    }
    mapState<T extends { [key: string]: keyof S }>(obj: T): {
      [I in keyof T]: () => S[T[I]]
    }
    mapState<T extends { [key: string]: string }>(obj: T): {
      [I in keyof T]: (...payloads: any[]) => any
    }

    mapGetters<K extends keyof G>(maps: K[]): Pick<G, K>
    mapGetters(depPath: string, maps: string[]): {
      [key: string]: () => any
    }
    mapGetters<T extends { [key: string]: keyof G }>(obj: T): {
      [I in keyof T]: G[T[I]]
    }
    mapGetters<T extends { [key: string]: string }>(obj: T): {
      [I in keyof T]: (...payloads: any[]) => any
    }

    mapMutations<K extends keyof M>(maps: K[]): Pick<M, K>
    mapMutations(depPath: string, maps: string[]): {
      [key: string]: (...payloads: any[]) => any
    }
    mapMutations<T extends { [key: string]: keyof M }>(obj: T): {
      [I in keyof T]: M[T[I]]
    }
    mapMutations<T extends { [key: string]: string }>(obj: T): {
      [I in keyof T]: (...payloads: any[]) => any
    }

    mapActions<K extends keyof A>(maps: K[]): Pick<A, K>
    mapActions(depPath: string, maps: string[]): {
      [key: string]: (...payloads: any[]) => any
    }
    mapActions<T extends { [key: string]: keyof A }>(obj: T): {
      [I in keyof T]: A[T[I]]
    }
    mapActions<T extends { [key: string]: string }>(obj: T): {
      [I in keyof T]: (...payloads: any[]) => any
    }

  }

  interface StoreOptWithThis<S, G, M, A, D extends Deps> {
    state?: S
    getters?: G & ThisType<{ state: S & UnboxDepsField<D, 'state'>, getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>, rootState: any }>
    mutations?: M & ThisType<{ state: S & UnboxDepsField<D, 'state'> }>
    actions?: A & ThisType<{
      rootState: any,
      state: S & UnboxDepsField<D, 'state'>,
      getters: GetComputedType<G> & UnboxDepsField<D, 'getters'>,
      dispatch: GetDispatchAndCommitWithThis<A, D, 'actions'>,
      commit: GetDispatchAndCommitWithThis<M, D, 'mutations'>
    }>
    deps?: D
    modules?: Record<string, StoreOptWithThis<{}, {}, {}, {}, {}>>
  }

  interface Store<S = {}, G = {}, M = {}, A = {}, D extends Deps = {}> {

    state: S & UnboxDepsField<D, 'state'>
    getters: GetGetters<G> & UnboxDepsField<D, 'getters'>
    mutations: GetMutations<M> & UnboxDepsField<D, 'mutations'>
    actions: GetActions<A> & UnboxDepsField<D, 'actions'>

    dispatch: GetDispatch<A, D>

    commit: GetCommit<M, D>

    mapState<K extends keyof S>(maps: K[]): {
      [I in K]: () => S[I]
    }
    mapState(depPath: string, maps: string[]): object

    mapGetters<K extends keyof G>(maps: K[]): {
      [I in K]: () => GetGetters<G>[I]
    }
    mapGetters(depPath: string, maps: string[]): {
      [key: string]: () => any
    }

    mapMutations<K extends keyof M>(maps: K[]): Pick<GetMutations<M>, K>
    mapMutations(depPath: string, maps: string[]): {
      [key: string]: (...payloads: any[]) => any
    }

    mapActions<K extends keyof A>(maps: K[]): Pick<GetActions<A>, K>
    mapActions(depPath: string, maps: string[]): {
      [key: string]: (...payloads: any[]) => any
    }

  }

  interface StoreOpt<S, G, M, A, D extends Deps> {
    state?: S,
    getters?: G
    mutations?: M,
    actions?: A,
    deps?: D
    modules?: Record<string, StoreOpt<{}, {}, {}, {}, {}>>
  }
}
