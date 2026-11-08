<script lang="ts">
  import Icon from '../lib/Icon.svelte';
  import Heading from '../lib/Heading.svelte';
  import Cartridge from '../lib/Cartridge.svelte';
  import { fa, normalizeSearch, type Collection, type Course } from '../lib/lessons';
  type CollectionNode = { collection: Collection; depth: number };
  export let courses: Course[];
  export let collections: Collection[];
  export let onopen: (course: Course) => void;
  export let onstudy: (course: Course) => void;
  export let onadd: (collectionId: string | null) => void;
  export let oncreatecollection: (name: string, parentId: string | null) => boolean;
  export let onrenamecollection: (id: string, name: string, parentId: string | null) => boolean;
  export let ondeletecollection: (id: string) => void;
  let search = '';
  let filter = 'all';
  let selectedCollectionId: string | null = null;
  let uncategorizedSelected = false;
  let creatingCollection = false;
  let editingCollection = false;
  let collectionName = '';
  let parentSelection = '';
  let collectionError = '';
  $: selectedCollection = collections.find((item) => item.id === selectedCollectionId) ?? null;
  function flatten(parentId: string | null = null, depth = 0, path: Set<string> = new Set()): CollectionNode[] {
    return collections
      .filter((item) => item.parentId === parentId && !path.has(item.id))
      .sort((first, second) => first.name.localeCompare(second.name, 'fa'))
      .flatMap((item) => {
        const nextPath = new Set(path).add(item.id);
        return [{ collection: item, depth }, ...flatten(item.id, depth + 1, nextPath)];
      });
  }
  $: collectionTree = flatten();
  function isDescendantOf(candidateId: string, ancestorId: string): boolean {
    let parentId = collections.find((item) => item.id === candidateId)?.parentId ?? null;
    while (parentId) {
      if (parentId === ancestorId) return true;
      parentId = collections.find((item) => item.id === parentId)?.parentId ?? null;
    }
    return false;
  }
  function containsCollection(course: Course, collectionId: string): boolean {
    let parent = collections.find((item) => item.id === collectionId);
    while (parent) {
      if (course.collectionId === parent.id) return true;
      parent = parent.parentId ? collections.find((item) => item.id === parent!.parentId) : undefined;
    }
    return false;
  }
  function matchesCollection(course: Course): boolean {
    if (uncategorizedSelected) return !course.collectionId;
    if (!selectedCollectionId) return true;
    return containsCollection(course, selectedCollectionId);
  }
  function collectionCount(id: string): number {
    return courses.filter((course) => containsCollection(course, id)).length;
  }
  function selectCollection(id: string | null, uncategorized = false) {
    selectedCollectionId = id;
    uncategorizedSelected = uncategorized;
    filter = 'all';
  }
  $: scopedCourses = courses.filter(matchesCollection);
  $: active =
    scopedCourses.find(
      (course) =>
        !course.archived && course.seen.length > 0 && course.seen.length < course.cards.length,
    ) ?? scopedCourses.find((course) => !course.archived);
  $: visible = scopedCourses.filter(
    (course) =>
      (filter === 'archived' ? course.archived : !course.archived) &&
      normalizeSearch(course.title).includes(normalizeSearch(search)) &&
      (filter === 'all' ||
        filter === 'archived' ||
        (filter === 'learning'
          ? course.seen.length < course.cards.length
          : course.seen.length === course.cards.length)),
  );
  function beginCreate(parentId: string | null = selectedCollectionId) {
    collectionName = '';
    collectionError = '';
    parentSelection = parentId ?? '';
    editingCollection = false;
    creatingCollection = true;
  }
  function saveCollection(event: SubmitEvent) {
    event.preventDefault();
    const name = collectionName.trim();
    if (!name) {
      collectionError = 'برای کالکشن یک نام بنویس.';
      return;
    }
    const duplicate = collections.some(
      (item) =>
        item.parentId === (parentSelection || null) &&
        normalizeSearch(item.name) === normalizeSearch(name) &&
        item.id !== (editingCollection ? selectedCollectionId : null),
    );
    if (duplicate) {
      collectionError = 'در این شاخه کالکشنی با این نام هست.';
      return;
    }
    const saved = editingCollection && selectedCollectionId
      ? onrenamecollection(selectedCollectionId, name, parentSelection || null)
      : oncreatecollection(name, parentSelection || null);
    if (saved) {
      creatingCollection = false;
      editingCollection = false;
      collectionError = '';
    }
  }
</script>

<div class="library-page page">
  <Heading title="کتابخانه" />
  <div class="library-toolbar">
    <label class="search-box"
      ><Icon name="search" /><input
        aria-label="جست‌وجوی درس"
        placeholder="جست‌وجوی درس..."
        bind:value={search}
      /></label
    ><button class="yellow add-course" onclick={() => onadd(selectedCollectionId)}
      ><Icon name="plus" />افزودن درس</button
    >
  </div>
  <section class="collection-panel" aria-label="کالکشن‌های درس‌ها">
    <div class="collection-panel-heading">
      <strong><Icon name="folder" size={19} />کالکشن‌ها</strong>
      {#if !creatingCollection}<button class="collection-create" onclick={() => beginCreate()}
          ><Icon name="plus" size={17} />کالکشن جدید</button
        >{/if}
    </div>
    <div class="collection-tree" role="tree" aria-label="درخت کالکشن‌ها">
      <button
        class="collection-node"
        class:selected={!selectedCollectionId && !uncategorizedSelected}
        role="treeitem"
        aria-selected={!selectedCollectionId && !uncategorizedSelected}
        onclick={() => selectCollection(null)}
        ><Icon name="book" size={18} /><span>همهٔ درس‌ها</span><small>{fa(courses.length)}</small></button
      >
      {#each collectionTree as node (node.collection.id)}
        {@const count = collectionCount(node.collection.id)}
        <div class="collection-tree-row" style:padding-inline-start={`${8 + node.depth * 14}px`}>
          <button
            class="collection-node"
            class:selected={selectedCollectionId === node.collection.id && !uncategorizedSelected}
            role="treeitem"
            aria-selected={selectedCollectionId === node.collection.id && !uncategorizedSelected}
            aria-level={node.depth + 1}
            onclick={() => selectCollection(node.collection.id)}
            ><Icon name={node.depth ? 'folder' : 'chip'} size={18} /><span>{node.collection.name}</span
            ><small>{fa(count)}</small></button
          >
          {#if selectedCollectionId === node.collection.id && !creatingCollection}<div class="collection-inline-actions">
              <button aria-label="ساخت کالکشن زیرمجموعه" title="ساخت زیرمجموعه" onclick={() => beginCreate(node.collection.id)}
                ><Icon name="plus" size={16} /></button
              ><button aria-label="تغییر نام کالکشن" title="تغییر نام" onclick={() => {collectionName=node.collection.name;parentSelection=node.collection.parentId??'';editingCollection=true;creatingCollection=true;}}
                ><Icon name="note" size={16} /></button
              ><button aria-label="حذف کالکشن" title="حذف کالکشن" onclick={() => {ondeletecollection(node.collection.id);selectCollection(null);}}
                ><Icon name="trash" size={16} /></button
            ></div>{/if}
        </div>
      {/each}
      <button
        class="collection-node"
        class:selected={uncategorizedSelected}
        role="treeitem"
        aria-selected={uncategorizedSelected}
        onclick={() => selectCollection(null, true)}
        ><Icon name="folder" size={18} /><span>بدون کالکشن</span><small
          >{fa(courses.filter((course) => !course.collectionId).length)}</small
        ></button
      >
    </div>
    {#if creatingCollection}<form class="collection-form" onsubmit={saveCollection}>
        <label>نام کالکشن<input bind:value={collectionName} maxlength="48" /></label>
        <label>زیرمجموعهٔ
          <select bind:value={parentSelection}>
            <option value="">کالکشن اصلی</option>
            {#each collectionTree.filter((node) => !editingCollection || !selectedCollectionId || (node.collection.id !== selectedCollectionId && !isDescendantOf(node.collection.id, selectedCollectionId))) as node}<option value={node.collection.id}
                >{'　'.repeat(node.depth)}{node.collection.name}</option
              >{/each}
          </select>
        </label>
        {#if collectionError}<p class="collection-error" role="alert">{collectionError}</p>{/if}
        <div><button class="yellow" type="submit">{editingCollection ? 'ذخیرهٔ نام' : 'ساخت کالکشن'}</button><button class="cream" type="button" onclick={() => {creatingCollection=false;editingCollection=false;collectionError='';}}>انصراف</button></div>
      </form>{/if}
  </section>
  <div class="library-filters" aria-label="فیلتر درس‌ها">
    {#each [{ id: 'all', label: 'همه' }, { id: 'learning', label: 'در حال یادگیری' }, { id: 'done', label: 'تمام‌شده' }] as item}<button
        class:yellow={filter === item.id}
        class:blue={filter !== item.id}
        aria-pressed={filter === item.id}
        onclick={() => (filter = item.id)}>{item.label}</button
      >{/each}{#if scopedCourses.some((course) => course.archived)}<button
        class:yellow={filter === 'archived'}
        class:blue={filter !== 'archived'}
        onclick={() => (filter = 'archived')}>بایگانی</button
      >{/if}
  </div>
  {#if active && !search && filter === 'all'}<article class="continue-card">
      <button class="yellow" onclick={() => onstudy(active)}
        ><Icon name="play" size={23} />ادامهٔ یادگیری</button
      >
      <div class="continue-info">
        <h2>ادامهٔ یادگیری</h2>
        <p>{active.title} · فصل: {active.cards[active.position].chapter}</p>
        <div class="course-progress">
          <progress max={active.cards.length} value={active.seen.length}></progress><span
            >{fa(active.seen.length)} از {fa(active.cards.length)} کارت</span
          >
        </div>
      </div>
      <Cartridge kind={active.kind} />
    </article>{/if}
  <div class="course-grid">
    {#each visible as course (course.id)}<button class="course-card" onclick={() => onopen(course)}
        ><div>
          <h2>{course.title}</h2>
          <p>{fa(course.cards.length)} کارت <small>· {course.description}</small></p>
          {#if course.seen.length}<div class="course-progress">
              <progress value={course.seen.length} max={course.cards.length}></progress><span
                >{fa(course.seen.length)} از {fa(course.cards.length)}</span
              >
            </div>{/if}
        </div>
        <Cartridge kind={course.kind} /><Icon name="back" size={22} /></button
      >{/each}
  </div>
  {#if !visible.length}<div class="empty-state">
      <Icon name="book" size={65} />
      <h2>{search ? 'درسی پیدا نشد' : 'هنوز درسی در این بخش نیست'}</h2>
      <p>{search ? 'نام دیگری را جست‌وجو کن.' : 'اولین درس خودت را اضافه کن.'}</p>
      <button class="yellow" onclick={() => onadd(selectedCollectionId)}>افزودن درس<Icon name="plus" /></button>
    </div>{/if}
</div>
