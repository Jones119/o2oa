package com.x.processplatform.service.processing.jaxrs.workcompleted;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.TreeMap;
import java.util.concurrent.Callable;
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import com.google.gson.JsonElement;
import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.entity.dataitem.DataItem;
import com.x.base.core.entity.dataitem.DataItemConverter;
import com.x.base.core.entity.dataitem.ItemCategory;
import com.x.base.core.project.exception.ExceptionEntityNotExist;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.WoId;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.tools.ListTools;
import com.x.processplatform.core.entity.content.Data;
import com.x.processplatform.core.entity.content.DocumentVersion;
import com.x.processplatform.core.entity.content.Read;
import com.x.processplatform.core.entity.content.ReadCompleted;
import com.x.processplatform.core.entity.content.Record;
import com.x.processplatform.core.entity.content.Review;
import com.x.processplatform.core.entity.content.TaskCompleted;
import com.x.processplatform.core.entity.content.WorkCompleted;
import com.x.processplatform.core.entity.content.WorkCompletedProperties;
import com.x.processplatform.core.entity.content.WorkCompletedProperties.RelatedForm;
import com.x.processplatform.core.entity.content.WorkCompletedProperties.RelatedScript;
import com.x.processplatform.core.entity.content.WorkCompletedProperties.StoreForm;
import com.x.processplatform.core.entity.content.WorkLog;
import com.x.processplatform.core.entity.element.Form;
import com.x.processplatform.core.entity.element.Script;
import com.x.processplatform.service.processing.Business;
import com.x.processplatform.service.processing.ProcessPlatformKeyClassifyExecutorFactory;
import com.x.processplatform.service.processing.ThisApplication;
import com.x.query.core.entity.Item;

class ActionMerge extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionMerge.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, String id) throws Exception {

		LOGGER.debug("execute:{}, id:{}.", effectivePerson::getDistinguishedName, () -> id);

		String executorSeed = null;

		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			WorkCompleted workCompleted = emc.fetch(id, WorkCompleted.class,
					ListTools.toList(WorkCompleted.job_FIELDNAME));
			if (null == workCompleted) {
				throw new ExceptionEntityNotExist(id, WorkCompleted.class);
			}
			executorSeed = workCompleted.getJob();
		}

		return ProcessPlatformKeyClassifyExecutorFactory.get(executorSeed).submit(new CallableAction(id)).get(300,
				TimeUnit.SECONDS);
	}

	public static class Wo extends WoId {

		private static final long serialVersionUID = 8166148918001178788L;
	}

	public class CallableAction implements Callable<ActionResult<Wo>> {

		private String id;

		CallableAction(String id) {
			this.id = id;
		}

		@Override
		public ActionResult<Wo> call() throws Exception {
			WorkCompleted workCompleted = null;
			try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
				workCompleted = emc.find(id, WorkCompleted.class);
				Business business = new Business(emc);
				List<Item> items = new ArrayList<>();
				List<TaskCompleted> taskCompleteds = new ArrayList<>();
				List<ReadCompleted> readCompleteds = new ArrayList<>();
				List<Review> reviews = new ArrayList<>();
				List<WorkLog> workLogs = new ArrayList<>();
				List<Record> records = new ArrayList<>();
				List<Read> reads = new ArrayList<>();
				List<DocumentVersion> documentVersions = new ArrayList<>();
				if (null != workCompleted) {
					Form form = business.element().get(workCompleted.getForm(), Form.class);
					if (null != form) {
						StoreForm storeForm = new StoreForm();
						StoreForm mobileStoreForm = new StoreForm();
						storeForm.setForm(new RelatedForm(form, form.getData()));
						mobileStoreForm.setForm(new RelatedForm(form, form.getMobileDataOrData()));
						try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
							scope.fork(() -> relateForm(business, form, storeForm));
							scope.fork(() -> relateScript(business, form, storeForm));
							scope.fork(() -> relateFormMobile(business, form, mobileStoreForm));
							scope.fork(() -> relateScriptMobile(business, form, mobileStoreForm));
							scope.joinUntil(Instant.now().plusSeconds(60));
							scope.throwIfFailed();
						}
						workCompleted.setStoreForm(storeForm);
						workCompleted.setMobileStoreForm(mobileStoreForm);
					}
					try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
						scope.fork(() -> mergeItem(business, workCompleted, items));
						scope.fork(() -> mergeTaskCompleted(business, workCompleted, taskCompleteds));
						scope.fork(() -> mergeReadCompleted(business, workCompleted, readCompleteds));
						scope.fork(() -> mergeReview(business, workCompleted, reviews));
						scope.fork(() -> mergeWorkLog(business, workCompleted, workLogs));
						scope.fork(() -> mergeRecord(business, workCompleted, records));
						scope.fork(() -> listRead(business, workCompleted, reads));
						scope.fork(() -> listDocumentVersion(business, workCompleted, documentVersions));
						scope.joinUntil(Instant.now().plusSeconds(60));
						scope.throwIfFailed();
					}
					emc.beginTransaction(WorkCompleted.class);
					workCompleted.setMerged(true);
					emc.commit();
					try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
						scope.fork(() -> deleteItem(business, items));
						scope.fork(() -> deleteWorkLog(business, workLogs));
						scope.fork(() -> deleteRecord(business, records));
						scope.fork(() -> deleteRead(business, reads));
						scope.fork(() -> deleteDocumentVersion(business, documentVersions));
						scope.joinUntil(Instant.now().plusSeconds(60));
						scope.throwIfFailed();
					}
					emc.commit();
					LOGGER.print("已完成工作合并, id: {}, title:{}, sequence:{}.", workCompleted.getId(),
							workCompleted.getTitle(), workCompleted.getSequence());
				}
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				throw new ExceptionMerge(e, id);
			}
			Wo wo = new Wo();
			wo.setId(id);
			ActionResult<Wo> result = new ActionResult<>();
			result.setData(wo);
			return result;
		}

		private Void mergeItem(Business business, WorkCompleted workCompleted, List<Item> items) throws Exception {
			List<Item> os = business.entityManagerContainer().listEqualAndEqual(Item.class,
					DataItem.bundle_FIELDNAME, workCompleted.getJob(), DataItem.itemCategory_FIELDNAME,
					ItemCategory.pp);
			DataItemConverter<Item> converter = new DataItemConverter<>(Item.class);
			JsonElement jsonElement = converter.assemble(os);
			workCompleted.setData(gson.fromJson(jsonElement, Data.class));
			items.addAll(os);
			return null;
		}

		private Void mergeTaskCompleted(Business business, WorkCompleted workCompleted,
				List<TaskCompleted> taskCompleteds) throws Exception {
			List<TaskCompleted> os = business.entityManagerContainer()
					.listEqual(TaskCompleted.class, TaskCompleted.job_FIELDNAME, workCompleted.getJob())
					.stream().sorted(Comparator.comparing(TaskCompleted::getCreateTime,
							Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
			workCompleted.setTaskCompletedList(os);
			taskCompleteds.addAll(os);
			return null;
		}

		private Void mergeReadCompleted(Business business, WorkCompleted workCompleted,
				List<ReadCompleted> readCompleteds) throws Exception {
			List<ReadCompleted> os = business.entityManagerContainer()
					.listEqual(ReadCompleted.class, ReadCompleted.job_FIELDNAME, workCompleted.getJob())
					.stream().sorted(Comparator.comparing(ReadCompleted::getCreateTime,
							Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
			workCompleted.setReadCompletedList(os);
			readCompleteds.addAll(os);
			return null;
		}

		private Void mergeReview(Business business, WorkCompleted workCompleted,
				List<Review> reviews) throws Exception {
			List<Review> os = business.entityManagerContainer()
					.listEqual(Review.class, Review.job_FIELDNAME, workCompleted.getJob()).stream()
					.sorted(Comparator.comparing(Review::getCreateTime, Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
			workCompleted.setReviewList(os);
			reviews.addAll(os);
			return null;
		}

		private Void mergeWorkLog(Business business, WorkCompleted workCompleted,
				List<WorkLog> workLogs) throws Exception {
			List<WorkLog> os = business.entityManagerContainer()
					.listEqual(WorkLog.class, WorkLog.JOB_FIELDNAME, workCompleted.getJob()).stream()
					.sorted(Comparator.comparing(WorkLog::getCreateTime, Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
			workCompleted.setWorkLogList(os);
			workLogs.addAll(os);
			return null;
		}

		private Void mergeRecord(Business business, WorkCompleted workCompleted,
				List<Record> records) throws Exception {
			List<Record> os = business.entityManagerContainer()
					.listEqual(Record.class, Record.job_FIELDNAME, workCompleted.getJob()).stream()
					.sorted(Comparator.comparing(Record::getCreateTime, Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
			workCompleted.setRecordList(os);
			records.addAll(os);
			return null;
		}

		private Void listDocumentVersion(Business business, WorkCompleted workCompleted,
				List<DocumentVersion> documentVersions) throws Exception {
			List<DocumentVersion> os = business.entityManagerContainer().listEqual(DocumentVersion.class,
					DocumentVersion.job_FIELDNAME, workCompleted.getJob());
			documentVersions.addAll(os);
			return null;
		}

		private Void listRead(Business business, WorkCompleted workCompleted, List<Read> reads) throws Exception {
			List<Read> os = business.entityManagerContainer()
					.listEqual(Read.class, Read.job_FIELDNAME, workCompleted.getJob()).stream()
					.sorted(Comparator.comparing(Read::getCreateTime, Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
			reads.addAll(os);
			return null;
		}

		private Void deleteItem(Business business, List<Item> items) throws Exception {
			business.entityManagerContainer().beginTransaction(Item.class);
			for (Item o : items) {
				business.entityManagerContainer().remove(o);
			}
			return null;
		}

		private Void deleteWorkLog(Business business, List<WorkLog> workLogs) throws Exception {
			business.entityManagerContainer().beginTransaction(WorkLog.class);
			for (WorkLog o : workLogs) {
				business.entityManagerContainer().remove(o);
			}
			return null;
		}

		private Void deleteRecord(Business business, List<Record> records) throws Exception {
			business.entityManagerContainer().beginTransaction(Record.class);
			for (Record o : records) {
				business.entityManagerContainer().remove(o);
			}
			return null;
		}

		private Void deleteDocumentVersion(Business business,
				List<DocumentVersion> documentVersions) throws Exception {
			business.entityManagerContainer().beginTransaction(DocumentVersion.class);
			for (DocumentVersion o : documentVersions) {
				business.entityManagerContainer().remove(o);
			}
			return null;
		}

		private Void deleteRead(Business business, List<Read> reads) throws Exception {
			business.entityManagerContainer().beginTransaction(Read.class);
			for (Read o : reads) {
				business.entityManagerContainer().remove(o);
			}
			return null;
		}

		private Void relateForm(Business business, Form form, StoreForm storeForm) throws Exception {
			Map<String, RelatedForm> map = new TreeMap<>();
			Form f;
			for (String fid : form.getProperties().getRelatedFormList()) {
				f = business.element().get(fid, Form.class);
				if (null != f) {
					map.put(fid, new RelatedForm(f, f.getData()));
				}
			}
			storeForm.setRelatedFormMap(map);
			return null;
		}

		private Void relateScript(Business business, Form form, StoreForm storeForm) throws Exception {
			Map<String, RelatedScript> map = new TreeMap<>();
			for (Entry<String, String> entry : form.getProperties().getRelatedScriptMap().entrySet()) {
				switch (entry.getValue()) {
				case WorkCompletedProperties.RelatedScript.TYPE_PROCESSPLATFORM:
					processPlatformScript(business, map, entry);
					break;
				case WorkCompletedProperties.RelatedScript.TYPE_CMS:
					cmsScript(business, map, entry);
					break;
				case WorkCompletedProperties.RelatedScript.TYPE_PORTAL:
					portalScript(business, map, entry);
					break;
				default:
					break;
				}
			}
			storeForm.setRelatedScriptMap(map);
			return null;
		}

		private Void relateFormMobile(Business business, Form form, StoreForm storeForm) throws Exception {
			Map<String, RelatedForm> map = new TreeMap<>();
			Form f;
			for (String fid : form.getProperties().getMobileRelatedFormList()) {
				f = business.element().get(fid, Form.class);
				if (null != f) {
					map.put(fid, new RelatedForm(f, f.getMobileDataOrData()));
				}
			}
			storeForm.setRelatedFormMap(map);
			return null;
		}

		private Void relateScriptMobile(Business business, Form form, StoreForm storeForm) throws Exception {
			Map<String, RelatedScript> map = new TreeMap<>();
			for (Entry<String, String> entry : form.getProperties().getMobileRelatedScriptMap().entrySet()) {
				switch (entry.getValue()) {
				case WorkCompletedProperties.RelatedScript.TYPE_PROCESSPLATFORM:
					processPlatformScript(business, map, entry);
					break;
				case WorkCompletedProperties.RelatedScript.TYPE_CMS:
					cmsScript(business, map, entry);
					break;
				case WorkCompletedProperties.RelatedScript.TYPE_PORTAL:
					portalScript(business, map, entry);
					break;
				case WorkCompletedProperties.RelatedScript.TYPE_SERVICE:
					serviceScript(business, map, entry);
					break;
				default:
					break;
				}
			}
			storeForm.setRelatedScriptMap(map);
			return null;
		}

		private void serviceScript(Business business, Map<String, RelatedScript> map, Entry<String, String> entry)
				throws Exception {
			com.x.program.center.core.entity.Script script = business.element().get(entry.getKey(),
					com.x.program.center.core.entity.Script.class);
			if (null != script) {
				map.put(entry.getKey(), new RelatedScript(script.getId(), script.getName(), script.getAlias(),
						script.getText(), entry.getValue()));
			}
		}

		private void portalScript(Business business, Map<String, RelatedScript> map, Entry<String, String> entry)
				throws Exception {
			com.x.portal.core.entity.Script script = business.element().get(entry.getKey(),
					com.x.portal.core.entity.Script.class);
			if (null != script) {
				map.put(entry.getKey(), new RelatedScript(script.getId(), script.getName(), script.getAlias(),
						script.getText(), entry.getValue()));
			}
		}

		private void cmsScript(Business business, Map<String, RelatedScript> map, Entry<String, String> entry)
				throws Exception {
			com.x.cms.core.entity.element.Script script = business.element().get(entry.getKey(),
					com.x.cms.core.entity.element.Script.class);
			if (null != script) {
				map.put(entry.getKey(), new RelatedScript(script.getId(), script.getName(), script.getAlias(),
						script.getText(), entry.getValue()));
			}
		}

		private void processPlatformScript(Business business, Map<String, RelatedScript> map,
				Entry<String, String> entry) throws Exception {
			Script script = business.element().get(entry.getKey(), Script.class);
			if (null != script) {
				map.put(entry.getKey(), new RelatedScript(script.getId(), script.getName(), script.getAlias(),
						script.getText(), entry.getValue()));
			}
		}
	}

}
