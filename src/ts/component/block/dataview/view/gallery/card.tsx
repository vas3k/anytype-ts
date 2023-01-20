import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { Cell, Cover, Icon, MediaAudio, MediaVideo } from 'Component';
import { I, DataUtil, ObjectUtil, Relation, keyboard } from 'Lib';
import { commonStore, detailStore, dbStore } from 'Store';
import Constant from 'json/constant.json';

interface Props extends I.ViewComponent {
	index: number;
	style?: any;
};

const Card = observer(class Card extends React.Component<Props> {

	_isMounted = false;
	node: any = null;

	render () {
		const { rootId, block, index, getView, getRecord, onRef, style, onContext, onCellClick, getIdPrefix, isInline } = this.props;
		const view = getView();
		const { cardSize, coverFit, hideIcon } = view;
		const relations = view.getVisibleRelations();
		const idPrefix = getIdPrefix();
		const record = getRecord(index);
		const cn = [ 'card', DataUtil.layoutClass(record.id, record.layout), DataUtil.cardSizeClass(cardSize) ];
		const readonly = true;
		const subId = dbStore.getSubId(rootId, block.id);

		if (coverFit) {
			cn.push('coverFit');
		};

		const BlankCover = (item: any) => (
			<div className={[ 'cover', 'type0', (!readonly ? 'canEdit' : '') ].join(' ')}>
				<div className="inner">
					{!readonly ? (
						<div className="add">
							<Icon className="plus" />
							Add picture
						</div>
					) : ''}
				</div>
			</div>
		);

		let cover = null;
		if (view.coverRelationKey) {
			cover = <BlankCover />;

			const coverNode = this.getCover();
			if (coverNode) {
				cover = coverNode;
			};
		};

		let content = (
			<div className="itemContent">
				{cover}
				<div className="inner">
					{relations.map((relation: any, i: number) => {
						const id = Relation.cellId(idPrefix, relation.relationKey, index);
						return (
							<Cell
								elementId={id}
								key={'list-cell-' + view.id + relation.relationKey}
								{...this.props}
								subId={subId}
								ref={(ref: any) => { onRef(ref, id); }}
								relationKey={relation.relationKey}
								viewType={view.type}
								idPrefix={idPrefix}
								index={index}
								arrayLimit={2}
								showTooltip={true}
								onClick={(e: any) => {
									e.stopPropagation();
									onCellClick(e, relation.relationKey, index);
								}}
								tooltipX={I.MenuDirection.Left}
								iconSize={18}
							/>
						);
					})}
				</div>
			</div>
		);

		if (!isInline) {
			content = (
				<div
					id={'selectable-' + record.id}
					className={[ 'selectable', 'type-' + I.SelectType.Record ].join(' ')}
					data-id={record.id}
					data-type={I.SelectType.Record}
				>
					{content}
				</div>
			);
		};

		return (
			<div 
				ref={node => this.node = node} 
				className={cn.join(' ')} 
				style={style} 
				onClick={(e: any) => { this.onClick(e); }}
				onContextMenu={(e: any) => { onContext(e, record.id); }}
			>
				{content}
			</div>
		);
	};

	componentDidMount () {
		this._isMounted = true;
		this.resize();
	};

	componentDidUpdate () {
		this.resize();
	};

	componentWillUnmount () {
		this._isMounted = false;
	};

	resize () {
		if (!this._isMounted) {
			return;
		};

		const node = $(this.node);
		const last = node.find('.cellContent:not(.isEmpty)').last();

		node.find('.cellContent').removeClass('last');
		if (last.length) {
			last.addClass('last');
		};
	};

	onClick (e: any) {
		e.preventDefault();

		const { index, getRecord, onContext, dataset } = this.props;
		const { selection } = dataset || {};
		const record = getRecord(index);
		const cb = {
			0: () => { 
				keyboard.withCommand(e) ? ObjectUtil.openWindow(record) : ObjectUtil.openPopup(record); 
			},
			2: () => { onContext(e, record.id); }
		};

		const ids = selection ? selection.get(I.SelectType.Record) : [];
		if (keyboard.withCommand(e) && ids.length) {
			return;
		};

		if ($(e.target).parents('.controls').length) {
			return;
		};

		if (cb[e.button]) {
			cb[e.button]();
		};
	};

	getCover (): any {
		const { rootId, block, index, getView, getRecord } = this.props;
		const view = getView();

		if (!view.coverRelationKey) {
			return null;
		};

		const subId = dbStore.getSubId(rootId, block.id);
		const record = getRecord(index);
		const value = Relation.getArrayValue(record[view.coverRelationKey]);
		const cn = [ 'cover', `type${I.CoverType.Upload}` ];

		let cover = null;

		if (view.coverRelationKey == 'pageCover') {
			const { coverType, coverId, coverX, coverY, coverScale } = record;

			if (coverId && coverType) {
				return (
					<Cover 
						type={coverType} 
						id={coverId} 
						image={coverId} 
						className={coverId} 
						x={coverX} 
						y={coverY} 
						scale={coverScale} 
						withScale={false} 
					/>
				);
			};
		};

		for (let id of value) {
			const f = detailStore.get(subId, id, []);
			if (f._empty_) {
				continue;
			};

			switch (f.type) {
				case Constant.typeId.image:
					cn.push('coverImage');
					cover = <img src={commonStore.imageUrl(f.id, 600)} />;
					break;

				case Constant.typeId.audio:
					cn.push('coverAudio');

					const playlist = [ 
						{ name: f.name, src: commonStore.fileUrl(f.id) },
					];

					cover = <MediaAudio playlist={playlist} />;
					break;

				case Constant.typeId.video:
					cn.push('coverVideo');
					cover = <MediaVideo src={commonStore.fileUrl(f.id)} />;
					break;
			};
		};

		if (!cover) {
			return null;
		};

		return (
			<div className={cn.join(' ')}>
				{cover}
			</div>
		);
	};

});

export default Card;