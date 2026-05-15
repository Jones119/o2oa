package com.x.processplatform.service.processing.jaxrs.snap;

import java.time.Instant;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.concurrent.StructuredTaskScope;
import java.util.stream.Collectors;

import org.apache.commons.codec.binary.Base64;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;

import com.google.gson.JsonElement;
import com.x.base.core.entity.dataitem.DataItem;
import com.x.base.core.entity.dataitem.DataItemConverter;
import com.x.base.core.entity.dataitem.ItemCategory;
import com.x.base.core.project.config.StorageMapping;
import com.x.base.core.project.jaxrs.StandardJaxrsAction;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.tools.ListTools;
import com.x.processplatform.core.entity.content.Data;
import com.x.processplatform.core.entity.content.DocSign;
import com.x.processplatform.core.entity.content.DocSignScrawl;
import com.x.processplatform.core.entity.content.DocumentVersion;
import com.x.processplatform.core.entity.content.Read;
import com.x.processplatform.core.entity.content.ReadCompleted;
import com.x.processplatform.core.entity.content.Record;
import com.x.processplatform.core.entity.content.Review;
import com.x.processplatform.core.entity.content.SnapProperties;
import com.x.processplatform.core.entity.content.Task;
import com.x.processplatform.core.entity.content.TaskCompleted;
import com.x.processplatform.core.entity.content.Work;
import com.x.processplatform.core.entity.content.WorkCompleted;
import com.x.processplatform.core.entity.content.WorkLog;
import com.x.processplatform.service.processing.Business;
import com.x.processplatform.service.processing.MessageFactory;
import com.x.processplatform.service.processing.ThisApplication;
import com.x.query.core.entity.Item;

abstract class BaseAction extends StandardJaxrsAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(BaseAction.class);

	protected SnapProperties snap(Business business, String job, List<Item> items, List<Work> works, List<Task> tasks,
			List<TaskCompleted> taskCompleteds, List<Read> reads, List<ReadCompleted> readCompleteds,
			List<Review> reviews, List<WorkLog> workLogs, List<Record> records, List<DocumentVersion> documentVersions,
			List<DocSign> docSigns, List<DocSignScrawl> docSignScrawls)
			throws Exception {
		SnapProperties properties = new SnapProperties();
		properties.setJob(job);
		try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
			scope.fork(() -> mergeItem(business, job, properties, items));
			scope.fork(() -> mergeWork(business, job, properties, works));
			scope.fork(() -> mergeTask(business, job, properties, tasks));
			scope.fork(() -> mergeTaskCompleted(business, job, properties, taskCompleteds));
			scope.fork(() -> mergeRead(business, job, properties, reads));
			scope.fork(() -> mergeReadCompleted(business, job, properties, readCompleteds));
			scope.fork(() -> mergeReview(business, job, properties, reviews));
			scope.fork(() -> mergeWorkLog(business, job, properties, workLogs));
			scope.fork(() -> mergeRecord(business, job, properties, records));
			scope.fork(() -> mergeDocumentVersion(business, job, properties, documentVersions));
			scope.fork(() -> mergeDocSign(business, job, properties, docSigns));
			scope.fork(() -> mergeDocSignScrawl(business, job, properties, docSignScrawls));
			scope.joinUntil(Instant.now().plusSeconds(60));
			scope.throwIfFailed();
		}
		if (ListTools.isNotEmpty(works)) {
			properties.setTitle(works.get(0).getTitle());
		}
		return properties;
	}

	protected SnapProperties snap(Business business, String job, List<Item> items, WorkCompleted workCompleted,
			List<TaskCompleted> taskCompleteds, List<Read> reads, List<ReadCompleted> readCompleteds,
			List<Review> reviews, List<WorkLog> workLogs, List<Record> records, List<DocSign> docSigns,
			List<DocSignScrawl> docSignScrawls) throws Exception {
		SnapProperties properties = new SnapProperties();
		properties.setJob(job);
		properties.setWorkCompleted(workCompleted);
		properties.setTitle(workCompleted.getTitle());
		try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
			scope.fork(() -> mergeTaskCompleted(business, job, properties, taskCompleteds));
			scope.fork(() -> mergeRead(business, job, properties, reads));
			scope.fork(() -> mergeReadCompleted(business, job, properties, readCompleteds));
			scope.fork(() -> mergeReview(business, job, properties, reviews));
			scope.fork(() -> mergeWorkLog(business, job, properties, workLogs));
			scope.fork(() -> mergeRecord(business, job, properties, records));
			scope.fork(() -> mergeDocSign(business, job, properties, docSigns));
			scope.fork(() -> mergeDocSignScrawl(business, job, properties, docSignScrawls));
			if (BooleanUtils.isNotTrue(workCompleted.getMerged())) {
				scope.fork(() -> mergeItem(business, job, properties, items));
			}
			scope.joinUntil(Instant.now().plusSeconds(60));
			scope.throwIfFailed();
		}

		return properties;
	}

	protected void clean(Business business, List<Item> items, List<Work> works, List<Task> tasks,
			List<TaskCompleted> taskCompleteds, List<Read> reads, List<ReadCompleted> readCompleteds,
			List<Review> reviews, List<WorkLog> workLogs, List<Record> records, List<DocumentVersion> documentVersions,
			List<DocSign> docSigns, List<DocSignScrawl> docSignScrawls)
			throws Exception {
		try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
			scope.fork(() -> deleteItem(business, items));
			scope.fork(() -> deleteWork(business, works));
			scope.fork(() -> deleteTask(business, tasks));
			scope.fork(() -> deleteTaskCompleted(business, taskCompleteds));
			scope.fork(() -> deleteRead(business, reads));
			scope.fork(() -> deleteReadCompleted(business, readCompleteds));
			scope.fork(() -> deleteReview(business, reviews));
			scope.fork(() -> deleteWorkLog(business, workLogs));
			scope.fork(() -> deleteRecord(business, records));
			scope.fork(() -> deleteDocumentVersion(business, documentVersions));
			scope.fork(() -> deleteDocSign(business, docSigns));
			scope.fork(() -> deleteDocSignScrawl(business, docSignScrawls));
			scope.joinUntil(Instant.now().plusSeconds(60));
			scope.throwIfFailed();
		}
	}

	protected void clean(Business business, List<Item> items, WorkCompleted workCompleted,
			List<TaskCompleted> taskCompleteds, List<Read> reads, List<ReadCompleted> readCompleteds,
			List<Review> reviews, List<WorkLog> workLogs, List<Record> records, List<DocSign> docSigns,
			List<DocSignScrawl> docSignScrawls) throws Exception {
		try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
			scope.fork(() -> deleteItem(business, items));
			scope.fork(() -> deleteWork(business, workCompleted));
			scope.fork(() -> deleteTaskCompleted(business, taskCompleteds));
			scope.fork(() -> deleteRead(business, reads));
			scope.fork(() -> deleteReadCompleted(business, readCompleteds));
			scope.fork(() -> deleteReview(business, reviews));
			scope.fork(() -> deleteWorkLog(business, workLogs));
			scope.fork(() -> deleteRecord(business, records));
			scope.fork(() -> deleteDocSign(business, docSigns));
			scope.fork(() -> deleteDocSignScrawl(business, docSignScrawls));
			scope.joinUntil(Instant.now().plusSeconds(60));
			scope.throwIfFailed();
		}
	}

	private Void mergeItem(Business business, String job, SnapProperties snapProperties,
			List<Item> items) throws Exception {
		List<Item> os = business.entityManagerContainer().listEqualAndEqual(Item.class,
				DataItem.bundle_FIELDNAME, job, DataItem.itemCategory_FIELDNAME, ItemCategory.pp);
		DataItemConverter<Item> converter = new DataItemConverter<>(Item.class);
		JsonElement jsonElement = converter.assemble(os);
		snapProperties.setData(gson.fromJson(jsonElement, Data.class));
		items.addAll(os);
		return null;
	}

	private Void mergeWork(Business business, String job, SnapProperties snapProperties,
			List<Work> works) throws Exception {
		List<Work> os = business.entityManagerContainer().listEqual(Work.class, Work.job_FIELDNAME, job)
				.stream()
				.sorted(Comparator.comparing(Work::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setWorkList(os);
		works.addAll(os);
		return null;
	}

	private Void mergeTask(Business business, String job, SnapProperties snapProperties,
			List<Task> tasks) throws Exception {
		List<Task> os = business.entityManagerContainer().listEqual(Task.class, Task.job_FIELDNAME, job)
				.stream()
				.sorted(Comparator.comparing(Task::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setTaskList(os);
		tasks.addAll(os);
		return null;
	}

	private Void mergeTaskCompleted(Business business, String job, SnapProperties snapProperties,
			List<TaskCompleted> taskCompleteds) throws Exception {
		List<TaskCompleted> os = business.entityManagerContainer()
				.listEqual(TaskCompleted.class, TaskCompleted.job_FIELDNAME, job).stream().sorted(Comparator
						.comparing(TaskCompleted::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setTaskCompletedList(os);
		taskCompleteds.addAll(os);
		return null;
	}

	private Void mergeRead(Business business, String job, SnapProperties snapProperties,
			List<Read> reads) throws Exception {
		List<Read> os = business.entityManagerContainer().listEqual(Read.class, Read.job_FIELDNAME, job)
				.stream()
				.sorted(Comparator.comparing(Read::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setReadList(os);
		reads.addAll(os);
		return null;
	}

	private Void mergeReadCompleted(Business business, String job, SnapProperties snapProperties,
			List<ReadCompleted> readCompleteds) throws Exception {
		List<ReadCompleted> os = business.entityManagerContainer()
				.listEqual(ReadCompleted.class, ReadCompleted.job_FIELDNAME, job).stream().sorted(Comparator
						.comparing(ReadCompleted::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setReadCompletedList(os);
		readCompleteds.addAll(os);
		return null;
	}

	private Void mergeReview(Business business, String job, SnapProperties snapProperties,
			List<Review> reviews) throws Exception {
		List<Review> os = business.entityManagerContainer().listEqual(Review.class, Review.job_FIELDNAME, job)
				.stream()
				.sorted(Comparator.comparing(Review::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setReviewList(os);
		reviews.addAll(os);
		return null;
	}

	private Void mergeWorkLog(Business business, String job, SnapProperties snapProperties,
			List<WorkLog> workLogs) throws Exception {
		List<WorkLog> os = business.entityManagerContainer()
				.listEqual(WorkLog.class, WorkLog.JOB_FIELDNAME, job).stream()
				.sorted(Comparator.comparing(WorkLog::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setWorkLogList(os);
		workLogs.addAll(os);
		return null;
	}

	private Void mergeRecord(Business business, String job, SnapProperties snapProperties,
			List<Record> records) throws Exception {
		List<Record> os = business.entityManagerContainer().listEqual(Record.class, Record.job_FIELDNAME, job)
				.stream()
				.sorted(Comparator.comparing(Record::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setRecordList(os);
		records.addAll(os);
		return null;
	}

	private Void mergeDocumentVersion(Business business, String job, SnapProperties snapProperties,
			List<DocumentVersion> documentVersions) throws Exception {
		List<DocumentVersion> os = business.entityManagerContainer()
				.listEqual(DocumentVersion.class, DocumentVersion.job_FIELDNAME, job).stream().sorted(Comparator
						.comparing(DocumentVersion::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setDocumentVersionList(os);
		documentVersions.addAll(os);
		return null;
	}

	private Void mergeDocSign(Business business, String job, SnapProperties snapProperties,
			List<DocSign> docSigns) throws Exception {
		List<DocSign> os = business.entityManagerContainer()
				.listEqual(DocSign.class, DocSign.job_FIELDNAME, job).stream()
				.sorted(Comparator.comparing(DocSign::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setDocSignList(os);
		docSigns.addAll(os);
		return null;
	}

	private Void mergeDocSignScrawl(Business business, String job, SnapProperties snapProperties,
			List<DocSignScrawl> docSignScrawls) throws Exception {
		List<DocSignScrawl> os = business.entityManagerContainer()
				.listEqual(DocSignScrawl.class, DocSignScrawl.job_FIELDNAME, job).stream().sorted(Comparator
						.comparing(DocSignScrawl::getCreateTime, Comparator.nullsLast(Date::compareTo)))
				.collect(Collectors.toList());
		snapProperties.setDocSignScrawlList(os);
		docSignScrawls.addAll(os);
		for (DocSignScrawl docSignScrawl : os) {
			if (StringUtils.isNotBlank(docSignScrawl.getStorage())) {
				StorageMapping mapping = ThisApplication.context().storageMappings().get(DocSignScrawl.class,
						docSignScrawl.getStorage());
				if (null != mapping) {
					byte[] bytes = docSignScrawl.readContent(mapping);
					snapProperties.getAttachmentContentMap().put(docSignScrawl.getId(),
							Base64.encodeBase64URLSafeString(bytes));
				}
			}
		}
		return null;
	}

	private Void deleteItem(Business business, List<Item> items) throws Exception {
		business.entityManagerContainer().beginTransaction(Item.class);
		for (Item o : items) {
			business.entityManagerContainer().remove(o);
		}
		return null;
	}

	private Void deleteWork(Business business, List<Work> works) throws Exception {
		business.entityManagerContainer().beginTransaction(Work.class);
		for (Work o : works) {
			business.entityManagerContainer().remove(o);
			MessageFactory.work_delete(o);
		}
		return null;
	}

	private Void deleteWork(Business business, WorkCompleted workCompleted) throws Exception {
		business.entityManagerContainer().beginTransaction(WorkCompleted.class);
		business.entityManagerContainer().remove(workCompleted);
		MessageFactory.workCompleted_delete(workCompleted);
		return null;
	}

	private Void deleteTask(Business business, List<Task> tasks) throws Exception {
		business.entityManagerContainer().beginTransaction(Task.class);
		for (Task o : tasks) {
			business.entityManagerContainer().remove(o);
			MessageFactory.task_delete(o);
		}
		return null;
	}

	private Void deleteTaskCompleted(Business business, List<TaskCompleted> taskCompleteds) throws Exception {
		business.entityManagerContainer().beginTransaction(TaskCompleted.class);
		for (TaskCompleted o : taskCompleteds) {
			business.entityManagerContainer().remove(o);
			MessageFactory.taskCompleted_delete(o);
		}
		return null;
	}

	private Void deleteRead(Business business, List<Read> reads) throws Exception {
		business.entityManagerContainer().beginTransaction(Read.class);
		for (Read o : reads) {
			business.entityManagerContainer().remove(o);
			MessageFactory.read_delete(o);
		}
		return null;
	}

	private Void deleteReadCompleted(Business business, List<ReadCompleted> readCompleteds) throws Exception {
		business.entityManagerContainer().beginTransaction(ReadCompleted.class);
		for (ReadCompleted o : readCompleteds) {
			business.entityManagerContainer().remove(o);
			MessageFactory.readCompleted_delete(o);
		}
		return null;
	}

	private Void deleteReview(Business business, List<Review> reviews) throws Exception {
		business.entityManagerContainer().beginTransaction(Review.class);
		for (Review o : reviews) {
			business.entityManagerContainer().remove(o);
			MessageFactory.review_delete(o);
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

	private Void deleteDocumentVersion(Business business, List<DocumentVersion> documentVersions) throws Exception {
		business.entityManagerContainer().beginTransaction(DocumentVersion.class);
		for (DocumentVersion o : documentVersions) {
			business.entityManagerContainer().remove(o);
		}
		return null;
	}

	private Void deleteDocSign(Business business, List<DocSign> docSigns) throws Exception {
		business.entityManagerContainer().beginTransaction(DocSign.class);
		for (DocSign o : docSigns) {
			business.entityManagerContainer().remove(o);
		}
		return null;
	}

	private Void deleteDocSignScrawl(Business business, List<DocSignScrawl> docSignScrawls) throws Exception {
		business.entityManagerContainer().beginTransaction(DocSignScrawl.class);
		for (DocSignScrawl o : docSignScrawls) {
			if (StringUtils.isNotBlank(o.getStorage())) {
				StorageMapping mapping = ThisApplication.context().storageMappings().get(DocSignScrawl.class,
						o.getStorage());
				if (null != mapping) {
					o.deleteContent(mapping);
				}
			}
			business.entityManagerContainer().remove(o);
		}
		return null;
	}

	protected Void deleteItem(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(Item.class);
		for (Item o : business.entityManagerContainer().listEqual(Item.class, DataItem.bundle_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
		}
		return null;
	}

	protected Void deleteWork(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(Work.class);
		for (Work o : business.entityManagerContainer().listEqual(Work.class, Work.job_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
			MessageFactory.work_delete(o);
		}
		return null;
	}

	protected Void deleteWorkCompleted(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(WorkCompleted.class);
		for (WorkCompleted o : business.entityManagerContainer().listEqual(WorkCompleted.class,
				WorkCompleted.job_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
			MessageFactory.workCompleted_delete(o);
		}
		return null;
	}

	protected Void deleteTask(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(Task.class);
		for (Task o : business.entityManagerContainer().listEqual(Task.class, Task.job_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
			MessageFactory.task_delete(o);
		}
		return null;
	}

	protected Void deleteTaskCompleted(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(TaskCompleted.class);
		for (TaskCompleted o : business.entityManagerContainer().listEqual(TaskCompleted.class,
				TaskCompleted.job_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
			MessageFactory.taskCompleted_delete(o);
		}
		return null;
	}

	protected Void deleteRead(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(Read.class);
		for (Read o : business.entityManagerContainer().listEqual(Read.class, Read.job_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
			MessageFactory.read_delete(o);
		}
		return null;
	}

	protected Void deleteReadCompleted(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(ReadCompleted.class);
		for (ReadCompleted o : business.entityManagerContainer().listEqual(ReadCompleted.class,
				ReadCompleted.job_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
			MessageFactory.readCompleted_delete(o);
		}
		return null;
	}

	protected Void deleteReview(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(Review.class);
		for (Review o : business.entityManagerContainer().listEqual(Review.class, Review.job_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
			MessageFactory.review_delete(o);
		}
		return null;
	}

	protected Void deleteWorkLog(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(WorkLog.class);
		for (WorkLog o : business.entityManagerContainer().listEqual(WorkLog.class, WorkLog.JOB_FIELDNAME,
				job)) {
			business.entityManagerContainer().remove(o);
		}
		return null;
	}

	protected Void deleteRecord(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(Record.class);
		for (Record o : business.entityManagerContainer().listEqual(Record.class, Record.job_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
		}
		return null;
	}

	protected Void deleteDocumentVersion(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(DocumentVersion.class);
		for (DocumentVersion o : business.entityManagerContainer().listEqual(DocumentVersion.class,
				DocumentVersion.job_FIELDNAME, job)) {
			business.entityManagerContainer().remove(o);
		}
		return null;
	}

	protected Void deleteDocSign(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(DocSign.class);
		for (DocSign o : business.entityManagerContainer().listEqual(DocSign.class, DocSign.job_FIELDNAME,
				job)) {
			business.entityManagerContainer().remove(o);
		}
		return null;
	}

	protected Void deleteDocSignScrawl(Business business, String job) throws Exception {
		business.entityManagerContainer().beginTransaction(DocSignScrawl.class);
		for (DocSignScrawl o : business.entityManagerContainer().listEqual(DocSignScrawl.class,
				DocSignScrawl.job_FIELDNAME, job)) {
			if (StringUtils.isNotBlank(o.getStorage())) {
				StorageMapping mapping = ThisApplication.context().storageMappings().get(DocSignScrawl.class,
						o.getStorage());
				if (null != mapping) {
					o.deleteContent(mapping);
				}
			}
			business.entityManagerContainer().remove(o);
		}
		return null;
	}
}
